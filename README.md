# NEUBAT

**Instalación desatendida de Arch Linux por red (iPXE), con portal web responsive que genera URLs únicas de configuración.**

Versión: 1.0.0 · Arquitectura: x86_64 · Sistema base: Arch Linux (rolling release) · Licencia: GPL-3.0

---

## Concepto

NEUBAT permite desplegar un Arch Linux completo, preconfigurado y funcional **desde Internet, sin medios físicos (USB/CD)**. El usuario define su instalación desde un portal web (móvil o escritorio), obtiene una URL/token único, y la máquina destino arranca por red (iPXE), descarga esa configuración e instala el sistema sin intervención.

Principios:

- **Zero-touch deployment** — cero intervención tras la selección inicial.
- **Infrastructure as Code** — toda la configuración versionada y reproducible (JSON + scripts).
- **Rolling release** — sistema siempre actualizado, sin migraciones traumáticas.
- **Monolito recortado** — sistema mínimo, sin bloatware, optimizado para su propósito.

## Objetivos medibles

| # | Objetivo | Métrica de éxito |
|---|----------|------------------|
| 1 | Portal de usuarios responsive | Accesible desde móvil/desktop, carga < 2 s |
| 2 | URL generada post-instalación | URL única funcional en < 5 min desde el arranque |
| 3 | Instalación desatendida | 0 intervenciones tras la selección inicial |

## Estructura del repositorio

```
neubat/
├── portal/                    # Portal web (Node.js + Express)
│   ├── server.js              # Servidor principal
│   ├── package.json
│   ├── lib/db.js              # Persistencia JSON y utilidades
│   ├── routes/install.js      # API: creación y entrega de configs, boot iPXE
│   ├── routes/status.js       # API: health y listado de instalaciones
│   └── public/index.html      # Frontend responsive (SPA ligera)
├── netboot/
│   ├── ipxe/neubat.ipxe       # Menú de arranque por red
│   └── grub/loopback.cfg      # Fallback: arranque de ISO desde disco (GRUB loopback)
├── scripts/
│   ├── neubat-install.sh      # Script maestro (orquestador)
│   ├── 00-preinstall.sh       # Validaciones previas
│   ├── 10-partition.sh        # Particionado automático (GPT/UEFI/btrfs, NVMe-safe)
│   ├── 20-archinstall.sh      # Config remota + sistema base (pacstrap)
│   ├── 30-postinstall.sh      # Configuración en chroot + aplicaciones
│   ├── 40-portal-deploy.sh    # Despliegue del portal local + URL única
│   └── validate-install.sh    # Checklist de validación post-instalación
├── configs/
│   ├── base.json              # Perfil mínimo (sin GUI)
│   ├── production.json        # Perfil producción (KDE + servicios)
│   └── developer.json         # Perfil desarrollo (GNOME + toolchains)
├── deploy/
│   └── pacman-cache/          # Proxy caché nginx de paquetes pacman (opcional)
└── docs/
    ├── INSTALL.md             # Documento maestro de instalación y despliegue
    ├── ARCHITECTURE.md        # Arquitectura técnica y diagrama de flujo
    └── ROADMAP.md             # Próximos pasos
```

## Quickstart

### 1. Portal web

```bash
cd portal
npm install
npm start          # http://localhost:3000
```

Desde el portal se crea una instalación (`POST /api/install`), que devuelve un `token` y una `boot_url` (`/boot/<token>`) con el script iPXE personalizado.

### 2. Arranque por red

Encadena iPXE a:

```
http://<servidor-portal>/boot/<token>
```

o usa `netboot/ipxe/neubat.ipxe` para el menú interactivo.

### 3. Instalación (desde el live ISO de Arch)

```bash
export NEUBAT_PORTAL_URL="http://<servidor-portal>"
bash scripts/neubat-install.sh <token> [perfil]
```

> **AVISO:** el instalador **destruye todos los datos** del disco objetivo. Usar solo en máquinas destinadas a ello.

### 4. Validación

Tras el primer arranque:

```bash
bash scripts/validate-install.sh
```

## Documentación

- [docs/INSTALL.md](docs/INSTALL.md) — documento maestro completo
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — diagrama de flujo y componentes
- [docs/ROADMAP.md](docs/ROADMAP.md) — próximos pasos

## Seguridad

- Las contraseñas iniciales son parametrizables vía JSON; el valor por defecto (`neubat`) **debe cambiarse en el primer acceso**.
- El portal aplica rate-limiting básico en `/api/*`. Para exposición pública, despliega detrás de un reverse proxy con TLS.

## Licencia

[GPL-3.0](LICENSE)
