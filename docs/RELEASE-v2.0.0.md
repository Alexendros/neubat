# NEUBAT 2.0.0

### Propósito de este documento

- **Objetivos:** Dejar las notas de la versión 2.0.0 alineadas con `CHANGELOG.md`, que es la fuente.
- **Estructura:** Mismas entradas que la sección `[2.0.0]` del changelog.
- **Contenido a integrar según contexto:** Si el changelog cambia antes del tag, copia aquí la misma sección. No redactes notas distintas.

## Added

- El configurador abre por tres caminos: Uso diario, Desarrollo y Servidor mínimo. Hyprland queda como ajuste.
- Alineación P0/P1/P2 al contrato de repositorio (docs canónicos, CI `quality`/`test`/`build`/`smoke`, Renovate, Make fachada, meta-secciones).
- `SUPPORT.md` y workflow `security` (actionlint semanal y en cambios de `.github/`).
- Pruebas de cuenta, sesión y absorción para que el gate de cobertura del portal se ejecute de verdad.
- Análisis CodeQL (JavaScript y Python), revisión de dependencias en pull requests y attestation del artefacto de frontend.

## Changed

- **Breaking:** `POST /api/install` rechaza un cifrado cuya contraseña o passphrase sea `neubat`. El laboratorio puede exportar `NEUBAT_ALLOW_DEFAULT_SECRETS=1`.
- El portal exige Node.js 22 o superior. Node 18 está fuera de soporte.
- axe corre sobre `Layout` (landing, configurar y cuenta) en Vitest. El job `smoke` ya no evalúa un HTML escrito a mano.
- El panel `/api/admin` cubre 404, borrado de token no hex y fallos de lectura (100 % de ramas en ese módulo).
- Línea base de cobertura del frontend: 43 % de líneas y 39 % de ramas (`npm run test:coverage` en `portal/frontend`). No es un gate.
- Los workflows fijan cada `uses` a un commit y `build-iso` declara permisos. El tag de la ISO entra por el entorno, no interpolado en el script.
- Los jobs de CI quedan encadenados: `quality` → `test` → `build` → `smoke`.
- `make test` recoge cobertura Jest (umbral global 70 %).
- Renovate programa minor/patch y lockfile antes de las 06:00, `Europe/Madrid`.

## Security

- El portal y el instalador rechazan un disco cifrado cuya contraseña o passphrase LUKS sea `neubat`. Laboratorio: `NEUBAT_ALLOW_DEFAULT_SECRETS=1`.
