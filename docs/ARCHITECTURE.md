# NEUBAT — Arquitectura técnica

## Diagrama de flujo completo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   USUARIO       │────▶│   PORTAL WEB    │────▶│   GENERACIÓN    │
│   (cualquier    │     │   NEUBAT        │     │   URL ÚNICA     │
│   dispositivo)  │     │   (responsive)  │     │   + TOKEN       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│   SISTEMA       │◀────│   POST-SCRIPT   │◀─────────────┘
│   INSTALADO     │     │   (40-portal-   │
│   + PORTAL      │     │   deploy.sh)    │
│   FUNCIONANDO   │     └─────────────────┘
└─────────────────┘
         ▲
         │
┌─────────────────┐     ┌─────────────────┐
│   NEUBAT-       │────▶│   CONFIG JSON   │
│   INSTALL.SH    │     │   (por token /  │
│   (desatendido) │     │   perfil local) │
└─────────────────┘     └─────────────────┘
         ▲
         │
┌─────────────────┐
│   ARRANQUE      │
│   iPXE/HTTP     │
│   (sin USB)     │
└─────────────────┘
```

## Componentes del sistema

| Capa | Componente | Tecnología | Función |
|------|------------|------------|---------|
| **Presentación** | Portal web | Node.js + Express, SPA vanilla | Interfaz usuario, generación de configs |
| **Persistencia** | DB JSON | `portal/data/installations.json` | Registro y seguimiento de instalaciones |
| **Distribución** | Arranque por red | iPXE + HTTP (mirror Arch) | Arranque sin medios físicos |
| **Fallback** | GRUB loopback | GRUB2 + ISO en disco | Arranque de ISO sin reescribir USB |
| **Instalación** | Script maestro | Bash + pacstrap | Sistema base desatendido |
| **Configuración** | Módulos de fases | Bash (00–40) + JSON | Personalización por token |
| **Post-instalación** | Portal local | systemd + Node.js | Portal en el sistema instalado, URL única |

## Secuencia de una instalación

1. El usuario crea la instalación en el portal → `POST /api/install` → token + `boot_url`.
2. La máquina destino arranca por red y encadena `boot_url` (`/boot/<token>`), que sirve un script iPXE personalizado con `neubat_token` en la línea de kernel.
3. El live ISO arranca; el operador (o un hook del ISO) ejecuta `neubat-install.sh <token>`.
4. `20-archinstall.sh` descarga la config del portal (`GET /api/config/<token>`); si falla, usa el perfil local.
5. Fases 1–5: particionado → pacstrap → chroot → aplicaciones → portal local.
6. El instalador notifica el resultado (`POST /api/complete`) y reinicia.
7. En el sistema instalado, `neubat-portal.service` sirve el portal local y `~/NEUBAT-URL.txt` contiene la URL única de setup.

## Decisiones de diseño

- **Sin jq/bc**: el ISO live de Arch garantiza `python3` pero no `jq` ni `bc`; el parseo JSON usa `python3` y la aritmética `awk`/`$(( ))`.
- **NVMe-safe**: `part_name()` resuelve `/dev/sda1` vs `/dev/nvme0n1p1`.
- **btrfs con zstd**: compresión transparente y `noatime` para SSD.
- **Perfiles declarativos**: los JSON de `configs/` definen paquetes y servicios; el portal los extiende sin tocar código.
- **Validación token**: `configPathFor()` exige hex de 32 caracteres (defensa contra path traversal).
