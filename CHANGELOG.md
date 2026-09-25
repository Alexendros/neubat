# Changelog

Registro de cambios relevantes de NEUBAT. Formato inspirado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Las versiones de producto (`1.0.x`) no se generan con semantic-release.

## [Unreleased]

### Added

- Alineación P0/P1/P2 al contrato de repositorio (docs canónicos, CI `quality`/`test`/`build`/`smoke`, Renovate, Make fachada, meta-secciones).
- `SUPPORT.md` y workflow `security` (actionlint semanal y en cambios de `.github/`).
- Pruebas de cuenta, sesión y absorción para que el gate de cobertura del portal se ejecute de verdad.

### Changed

- Los jobs de CI quedan encadenados: `quality` → `test` → `build` → `smoke`.
- `make test` recoge cobertura Jest (umbral global 70 %).
- Renovate programa minor/patch y lockfile antes de las 06:00, `Europe/Madrid`.

## [1.0.0] - 2026-09-20

### Added

- Portal web (Express + SPA React) con cuentas, configurador e integridad HMAC.
- Arranque iPXE e ISO híbrida autoinstalable.
- Particionado GPT/UEFI/btrfs, LUKS2 opcional y snapper.
- Post-instalación Ansible (first-boot) y panel `/admin`.
- Suite de tests del portal, frontend, bats y workflow opt-in de ISO.

Ver [docs/RELEASE-v1.0.0.md](docs/RELEASE-v1.0.0.md).
