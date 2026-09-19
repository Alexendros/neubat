# NEUBAT — Documento Maestro de Instalación y Despliegue

**Versión:** 1.0.0
**Fecha:** 19 de septiembre de 2026
**Arquitectura:** x86_64
**Sistema base:** Arch Linux (rolling release)
**Entorno:** Producción — SSD/HDD bare metal

---

## 1. Concepto y filosofía

NEUBAT es un sistema de instalación desatendida de Arch Linux que despliega un entorno completo, preconfigurado y funcional desde Internet, sin medios físicos (USB/CD), mediante un portal web responsive que genera URLs únicas de configuración.

- **Zero-touch deployment:** instalación sin intervención tras el arranque inicial.
- **Infrastructure as Code:** toda la configuración versionada y reproducible.
- **Rolling release:** sistema siempre actualizado sin migraciones traumáticas.
- **Monolito recortado:** sistema mínimo, sin bloatware.

### Objetivos medibles

| # | Objetivo | Métrica de éxito |
|---|----------|------------------|
| 1 | Portal usuarios responsive | Accesible desde móvil/desktop, < 2 s de carga |
| 2 | URL generada post-instalación | URL única funcional en < 5 min desde el arranque |
| 3 | Instalación desatendida | 0 intervenciones tras la selección inicial |

## 2. Requisitos

**Servidor del portal:** Node.js ≥ 18, puerto 3000 libre, conectividad con las máquinas destino.

**Máquina destino:** arranque UEFI, soporte de arranque por red (PXE/iPXE) o ISO en disco (fallback GRUB loopback), disco ≥ 32 GiB, conexión a Internet.

**Entorno live:** ISO oficial de Arch Linux reciente (incluye `python3`, `parted`, `pacstrap`, `reflector`).

## 3. Despliegue del portal

```bash
cd portal
npm install
npm start          # producción en :3000
npm run dev        # desarrollo
```

Como servicio systemd, usar como plantilla la unidad que genera `scripts/40-portal-deploy.sh` (`neubat-portal.service`).

### API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/install` | Crea instalación; body: `profile`, `hostname?`, `username?`, `desktop?`, `packages?[]` |
| GET | `/api/config/:token` | Devuelve el JSON de configuración (consumido por el instalador) |
| POST | `/api/complete` | El instalador notifica `status`, `hostname`, `error?` |
| GET | `/api/installations` | Últimas 50 instalaciones |
| GET | `/api/installations/:token` | Estado de una instalación |
| GET | `/api/health` | Health check |
| GET | `/boot/:token` | Script iPXE personalizado para el token |

El portal aplica rate-limiting (100 req / 15 min por IP) en `/api/*`. Para exposición pública, desplegar detrás de un reverse proxy con TLS.

## 4. Flujo de instalación

### 4.1 Crear la instalación

Desde la web (`http://<portal>/`) o por API:

```bash
curl -X POST http://<portal>:3000/api/install \
  -H 'Content-Type: application/json' \
  -d '{"profile":"production","hostname":"mi-equipo"}'
```

Respuesta: `token`, `config_url`, `boot_url`.

### 4.2 Arrancar la máquina destino

- **Por red (recomendado):** encadenar iPXE a `http://<portal>:3000/boot/<token>`, o usar `netboot/ipxe/neubat.ipxe` (menú interactivo).
- **Fallback USB/disco:** `netboot/grub/loopback.cfg` arranca el ISO almacenado en disco sin reescribir el medio.

### 4.3 Ejecutar el instalador (desde el live ISO)

```bash
export NEUBAT_PORTAL_URL="http://<portal>:3000"
export NEUBAT_ASSUME_YES=true          # omite la confirmación de borrado
bash scripts/neubat-install.sh <token> [perfil]
```

> **AVISO:** el instalador destruye todos los datos del disco objetivo.

### Fases

| Fase | Módulo | Acción |
|------|--------|--------|
| 0 | `00-preinstall.sh` | root, Internet, UEFI, herramientas live |
| 0b | `20-archinstall.sh` | Descarga config por token o usa perfil local |
| 1 | `10-partition.sh` | GPT: EFI 512M + raíz btrfs + home btrfs + swap 4G |
| 2 | `20-archinstall.sh` | Mirrors (reflector) + pacstrap + fstab |
| 3 | `30-postinstall.sh` | chroot: locale, usuarios, GRUB, yay, `/etc/neubat-release` |
| 4 | `30-postinstall.sh` | Desktop y paquetes/servicios de la configuración |
| 5 | `40-portal-deploy.sh` | Portal local + `~/NEUBAT-URL.txt` |
| 6 | maestro | Notificación al portal, resumen y reinicio |

## 5. Esquema de particionado

| Partición | Tamaño | FS | Montaje |
|-----------|--------|-----|---------|
| p1 (ESP) | 512 MiB | FAT32 | `/boot/efi` |
| p2 (raíz) | 30 GiB (20 GiB si disco < 64 GiB) | btrfs (zstd, noatime) | `/` |
| p3 (home) | resto − 4 GiB | btrfs (zstd, noatime) | `/home` |
| p4 (swap) | 4 GiB | swap | — |

Los nombres de partición se resuelven con `part_name()` (soporta `/dev/sda1` y `/dev/nvme0n1p1`).

## 6. Perfiles de configuración

Los perfiles viven en `configs/` (`base`, `production`, `developer`). Claves:

| Clave | Defecto | Descripción |
|-------|---------|-------------|
| `hostname` | `neubat-*` | Nombre del equipo |
| `username` | `neubat` | Usuario principal (grupo wheel) |
| `password` | `neubat` | Contraseña inicial de usuario y root — **cambiar en el primer acceso** |
| `disk` | `/dev/sda` | Disco objetivo (**se borra entero**) |
| `desktop` | `none` | `kde` · `gnome` · `xfce` · `none` |
| `packages` | — | Paquetes pacman adicionales (los paquetes AUR deben instalarse post-instalación con yay) |
| `services` | — | Servicios systemd a habilitar |
| `timezone` / `locale` / `keyboard` | Madrid / es_ES / es | Regionalización |

## 7. Portal local post-instalación

El sistema instalado incluye `neubat-portal.service` (Node.js en :3000, usuario no-root, código en `/opt/neubat-portal`). La URL única de setup queda en `~/NEUBAT-URL.txt`:

```
http://<hostname>.local:3000/setup/<machine-id-corto>
```

## 8. Validación post-instalación

```bash
bash scripts/validate-install.sh
```

Comprueba: `/etc/neubat-release`, hostname, usuario no-root, Internet, NetworkManager, sshd, Docker, portal local, espacio en disco y fstab. Devuelve código de salida no nulo si algo falla.

## 9. Notas de seguridad

- La construcción desatendida de paquetes AUR (yay) requiere `NOPASSWD` temporal en `%wheel`; **el instalador lo retira automáticamente** al terminar (`/etc/sudoers.d/neubat` queda `%wheel ALL=(ALL:ALL) ALL`).
- Cambiar las contraseñas iniciales de usuario y root en el primer acceso.
- Los tokens son hex aleatorios de 128 bits; el portal valida su formato antes de tocar el sistema de archivos.
- `boot_url` y `config_url` no llevan autenticación: quien posea el token puede descargar la configuración. Tratar los tokens como secretos y, en producción, servir bajo TLS.

## 10. Solución de problemas

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `Sin config personalizada; usando perfil local` | Portal inalcanzable o token inexistente | Verificar `NEUBAT_PORTAL_URL` y el token |
| `parted` falla en NVMe | Nombre de partición | Resuelto por `part_name()`; si persiste, revisar `lsblk` |
| `yay` no se instaló | Fallo de red/AUR durante el chroot | No crítico: `git clone https://aur.archlinux.org/yay.git && cd yay && makepkg -si` |
| Portal local no responde | `npm install` falló en destino | `cd /opt/neubat-portal && npm install --omit=dev && systemctl restart neubat-portal` |
| Log completo | — | `/var/log/neubat-install.log` (en el entorno live) |

## 11. Pruebas en VM (QEMU/KVM)

Lecciones aprendidas al validar NEUBAT en QEMU con disco NVMe virtual:

| Problema | Causa | Solución |
|----------|-------|----------|
| `IP-Config: no response` en initramfs | `ip=dhcp` activa el hook `net`, que busca `eth0` (nombres predecibles) | No pasar `ip=dhcp` si el rootfs no viene de red; el live ISO configura DHCP solo |
| `/dev/disk/by-label/ARCH_*` no aparece | cdrom IDE sin módulo en initramfs (máquina `pc`) | Usar `-machine q35` (cdrom SATA/AHCI) |
| Descarga de pacman congelada | virtio-net + red slirp se cuelga en transferencias grandes | Usar NIC `-device e1000,netdev=...` |
| reflector agota timeouts | su rating usa 5 s por defecto | `--download-timeout 30` en redes lentas |
| Consola serie sin prompt | el prompt zsh del ISO lleva códigos ANSI | En automatización (pexpect), usar patrones tolerantes a escapes |
| SSH tras instalar | `PermitRootLogin prohibit-password` por defecto | Entrar con el usuario del perfil, no root |

Ejemplo de lanzamiento con kernel directo (consola serie completa):

```bash
qemu-system-x86_64 -machine q35 -enable-kvm -cpu host -m 4096 -smp 4 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/OVMF/OVMF_CODE_4M.fd \
  -drive if=pflash,format=raw,file=vars.fd \
  -drive file=disk.qcow2,if=none,id=nvm0,format=qcow2 -device nvme,drive=nvm0 \
  -cdrom archlinux-x86_64.iso \
  -kernel vmlinuz-linux -initrd initramfs-linux.img \
  -append "archisobasedir=arch archisolabel=ARCH_YYYYMM console=ttyS0" \
  -netdev user,id=n0,hostfwd=tcp::2222-:22 -device e1000,netdev=n0 \
  -nographic
```

Para iterar rápido, usar la caché de paquetes de `deploy/pacman-cache/`.

---

**Hash de verificación del documento:** `neubat-doc-v1.0-20260919`
