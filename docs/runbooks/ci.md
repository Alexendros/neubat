# Runbook: CI

### Propósito de este documento

- **Objetivos:** Explicar los jobs canónicos y qué hacer cuando uno falla, sin promover e2e frágil a required.
- **Estructura:** Jobs → mapeo a Make → fallos → opt-in.
- **Contenido a integrar según contexto:** Renombra o documenta jobs aquí si cambia `.github/workflows/ci.yml`. No copies un pipeline de otro stack. `build-iso.yml` y `make test-vm` siguen opt-in.

## Jobs canónicos (`.github/workflows/ci.yml`)

| Job | Equivale a | Qué cubre |
| --- | ---------- | --------- |
| `quality` | `make validate` + `make lint` + Ansible syntax/lint + oxlint frontend | Estática |
| `test` | `make test` + frontend Vitest + `make test-bash` | Unidad / integración rápida |
| `build` | `make build-frontend` | Artefacto desplegable (SPA Vite) |
| `smoke` | `make smoke` + axe sintético del landing | Health + `POST /api/install` + a11y mínima |

## Fallos

1. Abre el log del job con el nombre canónico (`quality`, `test`, `build`, `smoke`).
2. Reproduce en local el objetivo Make de la tabla.
3. No “arregles” un rojo aflojando el job ni saltándote `validate`.
4. Si el fallo es de dependencia de Actions, Renovate debe proponer el bump (sin automerge de majors).

## Opt-in (no required)

- `make test-vm` — QEMU/NVMe, ~40 min. Ver [tests/vm/README.md](../../tests/vm/README.md).
- Workflow **Build ISO** — `workflow_dispatch` o tag `v*`.
