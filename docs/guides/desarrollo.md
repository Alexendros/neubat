# Guía de desarrollo

### Propósito de este documento

- **Objetivos:** Arrancar el portal en local, correr la fachada `make` y abrir un PR sin romper CI.
- **Estructura:** Requisitos → setup → comandos → flujo de rama → qué no commitear.
- **Contenido a integrar según contexto:** Adapta scripts npm de `portal/` y `portal/frontend/`. No copies un flujo pnpm/monorepo. La e2e QEMU (`make test-vm`) es opt-in y no es required en CI.

## Requisitos

- Node.js ≥ 18 (CI usa 22)
- npm
- `make`, `curl`, `python3`
- Opcional: `shellcheck`, `bats`, `ansible` + `ansible-lint`, Docker (ISO)

## Setup

```bash
cp -n .env.example .env   # no commitees .env
make install-deps
make install-deps-frontend
```

Portal en local:

```bash
make portal          # build frontend + npm start → http://localhost:3000
# o
docker compose up -d
```

## Fachada Make (contrato P1)

| Objetivo | Qué hace |
| -------- | -------- |
| `make lint` | shellcheck de `scripts/*.sh` + oxlint del frontend si hay `node_modules` |
| `make test` | Jest del portal |
| `make smoke` | `/api/health` + `POST /api/install` contra un portal temporal |
| `make validate` | `bash -n`, `node --check` y JSON de `configs/` |

Complementarios (no required de CI): `make test-frontend`, `make test-bash`, `make test-ansible`, `make test-vm`, `make build-iso`.

## Flujo de rama

`feat/*` / `fix/*` / `docs/*` / `chore/*` → PR contra `main`. Los agentes Cloud usan `cursor/…`.

Mensajes: Conventional Commits; cuerpo y docs en español.

## Qué no commitear

- `.env`, tokens reales, `ADMIN_TOKEN` / `NEUBAT_HMAC_SECRET` de producción
- `portal/data/`, `portal/configs/generated/`, `ansible/generated/`, `out/`
- `portal/public/assets/` y `portal/public/index.html` (artefacto Vite)
