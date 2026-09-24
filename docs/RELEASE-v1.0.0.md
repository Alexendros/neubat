# NEUBAT v1.0.0 — Release Notes

### Propósito de este documento

- **Objetivos:** Conservar las notas de la release pública v1.0.0 (ISO, portal Docker, panel admin).
- **Estructura:** Novedades → artefactos → uso de la ISO → seguridad → checksum.
- **Contenido a integrar según contexto:** No reescribas este histórico; las entradas nuevas van a [CHANGELOG.md](../CHANGELOG.md).

**Fecha:** 19 de septiembre de 2026

## Novedades

- **Portal web dockerizado** (`portal/Dockerfile` + `docker-compose.yml`).
- **ISO híbrida** `neubat-1.0.0-x86_64.iso` con hook de autoinstalación: arranca el instalador cuando se le pasa `neubat_token` en el kernel cmdline.
- **Servicio systemd** `neubat-autoinstall.service` en el live ISO que lee `neubat_token`, `neubat_profile` y `neubat_portal_url`.
- **Panel de administración web** en `/admin` para seguimiento de instalaciones.
- **Hero rediseñado** en el portal con captura de pantalla incluida en el README.

## Artefactos

| Fichero | Descripción |
|---------|-------------|
| `neubat-1.0.0-x86_64.iso` | Imagen híbrida booteable (UEFI/BIOS) con autoinstalador |
| `portal/Dockerfile` | Imagen de producción del portal |
| `docker-compose.yml` | Orquestación del portal + caché pacman opcional |

## Uso rápido de la ISO

1. Crea una instalación en el portal (`POST /api/install`).
2. Arranca la máquina destino con la ISO y añade al kernel cmdline:
   ```
   neubat_token=<token> neubat_profile=production neubat_portal_url=http://<portal>:3000
   ```
3. El instalador se ejecuta de forma desatendida y notifica al portal al finalizar.

## Seguridad

- Protección de rama `main` activa en GitHub (PR obligatorio, secret scanning, Dependabot alerts).
- Las contraseñas iniciales son parametrizables; cámbialas en el primer acceso.

## SHA256

```
# Comprobar tras descargar:
sha256sum neubat-1.0.0-x86_64.iso
```
