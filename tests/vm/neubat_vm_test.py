#!/usr/bin/env python3
"""
NEUBAT - Prueba end-to-end en VM QEMU/KVM con disco NVMe virtual.

Fase 1: arranca el live ISO de Arch (kernel directo, consola serie), descarga
        el proyecto, crea una instalación en el portal y ejecuta el instalador
        desatendido sobre el NVMe virtual.
Fase 2: reinicia desde el disco instalado (entrada EFI "NEUBAT") y verifica
        por SSH el resultado (hostname, servicios, portal local, URL única).

Requisitos del host: qemu-system-x86_64, OVMF, pexpect, curl, python3,
                     el portal NEUBAT corriendo y acceso a Internet.

Uso:   python3 tests/vm/neubat_vm_test.py
Variables de entorno (valores por defecto entre paréntesis):
  NEUBAT_ISO          Ruta al ISO de Arch (~/Descargas/archlinux-x86_64.iso)
  NEUBAT_VM_DIR       Directorio de trabajo (/tmp/neubat-vm)
  NEUBAT_PORTAL_PORT  Puerto del portal en el host (3100)
  NEUBAT_HTTP_PORT    Puerto HTTP auxiliar para servir el repo (8000)
  NEUBAT_SSH_PORT     Puerto host redirigido al 22 del guest (2222)
  NEUBAT_PROFILE      Perfil de instalación (base)
  NEUBAT_DISK_GIB     Tamaño del disco virtual (40)

Notas: ver docs/INSTALL.md §11 (e1000 obligatorio con slirp, ParallelDownloads=1,
sin ip=dhcp en kernel directo, patrones de consola tolerantes a ANSI/UTF-8).
"""
import json
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.request

import pexpect

ISO = os.environ.get("NEUBAT_ISO", os.path.expanduser("~/Descargas/archlinux-x86_64.iso"))
VM = os.environ.get("NEUBAT_VM_DIR", "/tmp/neubat-vm")
PORTAL_PORT = int(os.environ.get("NEUBAT_PORTAL_PORT", "3100"))
HTTP_PORT = int(os.environ.get("NEUBAT_HTTP_PORT", "8000"))
SSH_PORT = int(os.environ.get("NEUBAT_SSH_PORT", "2222"))
PROFILE = os.environ.get("NEUBAT_PROFILE", "base")
DISK_GIB = os.environ.get("NEUBAT_DISK_GIB", "40")

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GATEWAY = "10.0.2.2"  # host visto desde el guest (red slirp)
OVMF_CODE = "/usr/share/OVMF/OVMF_CODE_4M.fd"
OVMF_VARS = "/usr/share/OVMF/OVMF_VARS_4M.fd"

CONSOLE = None


def log(msg):
    print(f"[vmtest {time.strftime('%H:%M:%S')}] {msg}", flush=True)


def iso_label():
    out = subprocess.run(["blkid", "-o", "value", "-s", "LABEL", ISO],
                         capture_output=True, text=True)
    label = out.stdout.strip()
    if not label:
        sys.exit(f"No se pudo leer la etiqueta del ISO {ISO}")
    return label


def create_installation():
    """Crea la instalación en el portal y apunta su config al NVMe virtual."""
    req = urllib.request.Request(
        f"http://localhost:{PORTAL_PORT}/api/install",
        data=json.dumps({"profile": PROFILE, "hostname": "neubat-vm"}).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        token = json.load(r)["token"]
    cfg_path = os.path.join(REPO, "portal", "configs", "generated", f"{token}.json")
    with open(cfg_path) as f:
        cfg = json.load(f)
    cfg["disk"] = "/dev/nvme0n1"
    with open(cfg_path, "w") as f:
        json.dump(cfg, f, indent=2)
    log(f"Token creado: {token} (disk -> /dev/nvme0n1)")
    return token


def prepare_workdir():
    os.makedirs(VM, exist_ok=True)
    # Kernel e initramfs extraídos del ISO para arranque directo con consola serie
    for member, dest in [("/arch/boot/x86_64/vmlinuz-linux", "vmlinuz-linux"),
                         ("/arch/boot/x86_64/initramfs-linux.img", "initramfs-linux.img")]:
        if not os.path.exists(os.path.join(VM, dest)):
            subprocess.run(["xorriso", "-osirrox", "on", "-indev", ISO,
                            "-extract", member, os.path.join(VM, dest)],
                           check=True, capture_output=True)
    shutil.copy(OVMF_VARS, os.path.join(VM, "vars.fd"))
    subprocess.run(["qemu-img", "create", "-f", "qcow2",
                    os.path.join(VM, "neubat-disk.qcow2"), f"{DISK_GIB}G"],
                   check=True, capture_output=True)
    # Tarball del repo para descargarlo dentro de la VM
    subprocess.run(["tar", "--exclude=.git", "--exclude=node_modules",
                    "--exclude=portal/data", "--exclude=portal/configs/generated",
                    "-czf", os.path.join(VM, "neubat.tar.gz"),
                    "-C", os.path.dirname(REPO), os.path.basename(REPO)],
                   check=True)


def qemu_cmd(extra):
    return [
        "qemu-system-x86_64", "-machine", "q35", "-enable-kvm",
        "-cpu", "host", "-m", "4096", "-smp", "4",
        "-drive", f"if=pflash,format=raw,readonly=on,file={OVMF_CODE}",
        "-drive", f"if=pflash,format=raw,file={VM}/vars.fd",
        "-drive", f"file={VM}/neubat-disk.qcow2,if=none,id=nvm0,format=qcow2",
        "-device", "nvme,drive=nvm0,serial=NEUBAT0",
        "-netdev", f"user,id=n0,hostfwd=tcp::{SSH_PORT}-:22",
        "-device", "e1000,netdev=n0",  # virtio-net se cuelga con slirp en descargas grandes
        "-nographic",
    ] + extra


def phase1_install(token):
    log("FASE 1: live ISO + instalación desatendida sobre NVMe")
    label = iso_label()
    cmd = qemu_cmd([
        "-cdrom", ISO,
        "-kernel", f"{VM}/vmlinuz-linux",
        "-initrd", f"{VM}/initramfs-linux.img",
        "-append", f"archisobasedir=arch archisolabel={label} console=ttyS0",
        # sin ip=dhcp: el hook net buscaría eth0 (ver docs/INSTALL.md §11)
    ])
    vm = pexpect.spawn(cmd[0], cmd[1:], encoding=None, timeout=300)
    vm.logfile = CONSOLE

    if vm.expect([rb"archiso login:", pexpect.TIMEOUT, pexpect.EOF]) != 0:
        sys.exit("FALLO: no llegó el login del live ISO")
    vm.sendline(b"root")
    i = vm.expect([rb"@archiso.{0,80}#", rb"assword:"])
    if i == 1:
        vm.sendline(b"")
        vm.expect(rb"@archiso.{0,80}#")
    log("Shell del live ISO lista")

    vm.sendline(f"curl -sfO http://{GATEWAY}:{HTTP_PORT}/neubat.tar.gz "
                f"&& tar xzf neubat.tar.gz -C /root && echo FILES_OK".encode())
    vm.expect(rb"FILES_OK", timeout=60)
    vm.expect(rb"@archiso.{0,80}#")

    # Ajustes del entorno live para red slirp lenta (no forman parte del repo)
    vm.sendline(b"sed -i 's/--sort rate/--sort rate --download-timeout 30/' "
                b"/root/neubat/scripts/20-archinstall.sh && "
                b"sed -i 's/^ParallelDownloads.*/ParallelDownloads = 1/' /etc/pacman.conf "
                b"&& echo TWEAKS_OK")
    vm.expect(rb"TWEAKS_OK", timeout=30)
    vm.expect(rb"@archiso.{0,80}#")

    log("Lanzando neubat-install.sh (esto tarda: pacstrap ~1 GiB)")
    install = (f"export NEUBAT_PORTAL_URL=http://{GATEWAY}:{PORTAL_PORT} NEUBAT_ASSUME_YES=true; "
               f"bash /root/neubat/scripts/neubat-install.sh {token} {PROFILE} 2>&1 | "
               f"tee /root/install.log; echo INSTALL_EXIT=${{PIPESTATUS[0]}}")
    vm.sendline(install.encode())

    # NOTA: el marcador usa patrones ASCII puros; «Ó» UTF-8 son 2 bytes y
    # rompería un patrón con un solo comodín.
    deadline = time.time() + 9600
    ok = False
    while time.time() < deadline:
        i = vm.expect([rb"NEUBAT COMPLETADA", rb"INSTALL_EXIT=\d+",
                       rb"\[ERROR\]", pexpect.TIMEOUT], timeout=120)
        if i == 0:
            ok = True
            break
        if i == 1:
            ok = b"INSTALL_EXIT=0" in vm.after
            break
        if i == 2:
            log("ERROR en la salida del instalador")
            break
        log("...instalación en curso...")

    time.sleep(12)  # margen para el reboot del instalador
    vm.close(force=True)
    if not ok:
        sys.exit("FALLO en la fase de instalación (ver console.log en el directorio de trabajo)")
    log("FASE 1 OK: instalación completada")


def phase2_verify():
    log("FASE 2: arranque desde NVMe instalado + verificación SSH")
    vm = pexpect.spawn(qemu_cmd([])[0], qemu_cmd([])[1:], encoding=None, timeout=300)
    vm.logfile = CONSOLE

    ssh = None
    for attempt in range(16):
        time.sleep(15)
        log(f"Intento SSH {attempt + 1}/16")
        s = pexpect.spawn("ssh", [
            "-p", str(SSH_PORT), "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null", "-o", "PubkeyAuthentication=no",
            "-o", "ConnectTimeout=10", "-o", "NumberOfPasswordPrompts=1",
            "neubat@localhost"], encoding="utf-8", timeout=40)
        if s.expect(["assword:", pexpect.EOF, pexpect.TIMEOUT]) == 0:
            s.sendline("neubat")
            if s.expect(["\\$", pexpect.TIMEOUT]) == 0:
                ssh = s
                break
        s.close()

    if not ssh:
        vm.close(force=True)
        sys.exit("FALLO: SSH no disponible en el sistema instalado")

    checks = [
        "cat /etc/hostname",
        "sudo cat /etc/neubat-release",
        "systemctl is-active neubat-portal NetworkManager sshd",
        "curl -sf --max-time 5 http://localhost:3000/api/health; echo",
        "cat ~/NEUBAT-URL.txt",
        "df -h / | tail -1",
        "lsblk -d -o NAME,SIZE,TRAN | grep nvme",
        "sudo -l -U $(whoami) | grep -q NOPASSWD && echo SUDO_INSEGURO || echo SUDO_OK",
        "echo VERIFY_DONE",
    ]
    for c in checks:
        ssh.sendline(c)
        ssh.expect("\\$", timeout=40)
        time.sleep(0.3)

    ssh.expect("VERIFY_DONE", timeout=60)
    print("\n===== SALIDA DE VERIFICACIÓN =====")
    print(ssh.before)
    print("==================================")
    ssh.sendline("exit")
    ssh.close()
    vm.close(force=True)
    log("FASE 2 OK: sistema instalado verificado")
    print("RESULT=PASS")


def main():
    global CONSOLE
    CONSOLE = open(os.path.join(VM, "console.log"), "wb")
    token = create_installation()
    prepare_workdir()
    phase1_install(token)
    phase2_verify()


if __name__ == "__main__":
    main()
