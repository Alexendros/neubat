# NEUBAT — Panel de paquetes por perfil

Este documento lista los paquetes que vienen predefinidos en cada perfil de instalación. Los paquetes marcados con **(AUR)** no están en los repositorios oficiales de Arch Linux y se instalan con `yay` tras el primer arranque si fallan durante la instalación desatendida.

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| 🖥️ | Entorno de escritorio / gestor de ventanas |
| 🔧 | Herramientas de desarrollo/sistema |
| 🌐 | Red / Internet |
| 🛡️ | Seguridad / cifrado |
| 🎨 | Multimedia / productividad |
| 📦 | Servicios / infraestructura |

---

## Perfil `base` (mínimo)

Escritorio: `none` · Disco: `/dev/sda` · Cifrado: desactivado

| Paquete | Categoría | Descripción |
|---------|-----------|-------------|
| `htop` | 🔧 | Monitor de procesos interactivo |
| `btop` | 🔧 | Monitor de recursos con gráficos ANSI |
| `fastfetch` | 🔧 | Información del sistema (sustituto moderno de neofetch) |
| `git` | 🔧 | Control de versiones |
| `curl` | 🌐 | Cliente HTTP/HTTPS |
| `wget` | 🌐 | Descarga de archivos por HTTP/FTP |
| `okular` | 🎨 | Visor de documentos universal (PDF, ePub, DjVu, etc.) |

Servicios habilitados: `NetworkManager`, `sshd`

---

## Perfil `production` (escritorio KDE + apps ofimáticas)

Escritorio: `kde` · Disco: `/dev/nvme0n1` · Cifrado: **activado con keyfile**

| Paquete | Categoría | Descripción |
|---------|-----------|-------------|
| `plasma-meta` | 🖥️ | Escritorio KDE Plasma |
| `kde-applications-meta` | 🖥️ | Aplicaciones básicas de KDE |
| `sddm` | 🖥️ | Gestor de pantalla |
| `docker` | 📦 | Contenedores |
| `docker-compose` | 📦 | Orquestación de contenedores |
| `nodejs` / `npm` | 🔧 | Runtime y gestor de paquetes JavaScript |
| `python` / `python-pip` | 🔧 | Python 3 y pip |
| `nginx` | 📦 | Servidor web/proxy inverso |
| `postgresql` | 📦 | Base de datos relacional |
| `redis` | 📦 | Almacén clave-valor en memoria |
| `htop` / `btop` / `fastfetch` | 🔧 | Monitores del sistema |
| `git` / `curl` / `wget` | 🔧🌐 | Desarrollo y red |
| `firefox` | 🌐 | Navegador web |
| `libreoffice-fresh` | 🎨 | Suite ofimática |
| `vlc` | 🎨 | Reproductor multimedia |
| `gimp` | 🎨 | Edición de imágenes |
| `okular` | 🎨 | Visor de documentos |

Servicios habilitados: `NetworkManager`, `sshd`, `docker`, `nginx`, `postgresql`, `redis`

### Cambios recientes

- **Añadido:** `okular` (visor de documentos).
- **Eliminados:** `audacity`, `shotwell`. Si necesitas gestión fotográfica avanzada, instala `digiKam` desde KDE.

---

## Perfil `developer` (escritorio GNOME + toolchain)

Escritorio: `gnome` · Disco: `/dev/sda` · Cifrado: desactivado

| Paquete | Categoría | Descripción |
|---------|-----------|-------------|
| `gnome` / `gnome-extra` | 🖥️ | Escritorio GNOME y aplicaciones extra |
| `gdm` | 🖥️ | Gestor de pantalla |
| `docker` / `docker-compose` | 📦 | Contenedores |
| `nodejs` / `npm` / `yarn` | 🔧 | JavaScript/TypeScript |
| `python` / `python-pip` / `python-poetry` | 🔧 | Python y gestores de dependencias |
| `go` | 🔧 | Lenguaje Go |
| `rust` | 🔧 | Lenguaje Rust (toolchain) |
| `code` | 🔧 | Visual Studio Code (editor) |
| `jetbrains-toolbox` | 🔧 | Gestor de IDEs JetBrains **(AUR)** |
| `postman-bin` | 🔧 | Cliente API REST **(AUR)** |
| `insomnia` | 🔧 | Cliente API REST alternativo **(AUR)** |
| `github-cli` | 🔧 | CLI de GitHub (`gh`) |
| `gitlab-runner` | 🔧 | Runner de CI/CD de GitLab |
| `kubectl` / `helm` | 🔧 | Orquestación Kubernetes |
| `minikube` | 🔧 | Kubernetes local |
| `terraform` | 🔧 | Infraestructura como código |
| `ansible` | 🔧 | Automatización de configuración |
| `git` | 🔧 | Control de versiones |
| `okular` | 🎨 | Visor de documentos |

Servicios habilitados: `NetworkManager`, `sshd`, `docker`

---

## Paquetes base del sistema (todos los perfiles)

Instalados siempre por `pacstrap` en `scripts/20-archinstall.sh`:

| Paquete | Propósito |
|---------|-----------|
| `base` | Sistema base de Arch Linux |
| `linux` / `linux-firmware` | Kernel y firmware |
| `btrfs-progs` | Utilidades para btrfs |
| `cryptsetup` | Cifrado LUKS (necesario aunque el perfil no lo active) |
| `grub` / `efibootmgr` | Cargador de arranque UEFI |
| `networkmanager` | Conectividad de red |
| `sudo` / `git` / `base-devel` | Privilegios, fuentes y compilación |
| `curl` / `wget` / `inetutils` | Herramientas de red |
| `reflector` | Optimización de mirrors pacman |
| `neovim` / `nano` | Editores de texto |
| `terminus-font` | Fuente para consola |
| `openssh` | Servidor SSH |
| `ansible` | Automatización post-instalación (first-boot) |

---

## Aplicaciones sugeridas (no incluidas por defecto)

| Aplicación | Paquete | Notas |
|------------|---------|-------|
| Proton Mail (escritorio) | `proton-mail` | **AUR**; cliente oficial de Proton Mail. Instalar tras el primer arranque con `yay -S proton-mail` |
| Proton VPN | `proton-vpn-gtk-app` | **AUR** |
| Brave | `brave-bin` | **AUR**; navegador centrado en privacidad |
| KeePassXC | `keepassxc` | Gestor de contraseñas |
| Nextcloud Desktop | `nextcloud-client` | Sincronización de nube |

---

**Fecha del documento:** 22 de septiembre de 2026
