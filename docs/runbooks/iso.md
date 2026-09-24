# Runbook: ISO híbrida

### Propósito de este documento

- **Objetivos:** Construir y diagnosticar la ISO autoinstalable sin convertir el job en required de cada PR.
- **Estructura:** Cuándo usarlo → comando → fallos habituales → artefactos.
- **Contenido a integrar según contexto:** El workflow `.github/workflows/build-iso.yml` es opt-in (`workflow_dispatch` / tags `v*`). No lo marques required. No subas la ISO al git.

## Cuándo

- Release o prueba de arranque UEFI/BIOS
- Cambio en `scripts/build-iso.sh`, `iso/airootfs/` o el hook `neubat-autoinstall`

No forma parte de `quality` / `test` / `smoke`. QEMU e2e (`make test-vm`) es otro opt-in (~40 min).

## Comando

```bash
make build-iso          # TAG=1.0.0 por defecto
# out/neubat-1.0.0-x86_64.iso
```

Requiere Docker. El workflow de GitHub sube el ISO + SHA256 como artefacto (7 días) y, en tags `v*`, crea el Release.

## Fallos habituales

| Señal | Acción |
| ----- | ------ |
| Docker no disponible | Instala el daemon o usa el workflow `workflow_dispatch` |
| Espacio en disco | La ISO ronda 1.6 GB; limpia `out/` |
| Hook no arranca | Revisa `iso/airootfs/.../neubat-autoinstall.service` y el cmdline `neubat_token` |
| Hash no coincide | Compara con `*.iso.sha256` de la release; no reutilices ISOs a medias |

## Artefactos

`out/` está en `.gitignore`. Publica solo vía GitHub Release, no en el árbol.
