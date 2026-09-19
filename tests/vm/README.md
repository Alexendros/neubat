# Prueba end-to-end en VM (QEMU/KVM + NVMe virtual)

`neubat_vm_test.py` reproduce la validación realizada el 19-sep-2026: instalación
desatendida completa del perfil elegido sobre un disco NVMe virtual y
verificación SSH del sistema instalado.

## Requisitos del host

- QEMU con KVM (`qemu-system-x86_64`, usuario en grupo `kvm`)
- OVMF (`/usr/share/OVMF/OVMF_{CODE,VARS}_4M.fd`)
- `pexpect`, `xorriso`, `qemu-img`, `blkid`
- ISO oficial de Arch Linux
- Portal NEUBAT corriendo (`cd portal && npm start`) y un servidor HTTP
  sirviendo el directorio de trabajo (para el tarball del repo):

```bash
cd /tmp/neubat-vm && python3 -m http.server 8000 &
```

## Uso

```bash
python3 tests/vm/neubat_vm_test.py
# o vía make:
make test-vm
```

Variables de entorno documentadas en la cabecera del script (ISO, puertos,
perfil, tamaño de disco).

## Qué verifica

1. Creación de instalación vía API del portal (token + config con `/dev/nvme0n1`).
2. Arranque del live ISO con kernel directo y consola serie.
3. Instalador desatendido: particionado NVMe → pacstrap → chroot → portal local.
4. Reinicio desde la entrada EFI «NEUBAT» del sistema instalado.
5. SSH como usuario del perfil y comprobaciones: hostname, `/etc/neubat-release`,
   servicios activos, API del portal local, `NEUBAT-URL.txt`, layout NVMe,
   sudo endurecido (sin NOPASSWD).

## Problemas conocidos del entorno VM

Ver `docs/INSTALL.md` §11: NIC e1000 obligatoria con slirp, `ParallelDownloads=1`,
no usar `ip=dhcp` sin netboot, patrones de consola tolerantes a ANSI/UTF-8.
