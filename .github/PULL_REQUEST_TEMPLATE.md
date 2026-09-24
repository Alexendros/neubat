<!-- canon-managed: true -->

### Propósito de este documento

- **Objetivos:** Plantilla de PR para describir el cambio y exigir las comprobaciones `lint` / `test` / `smoke` / `validate` y los jobs `quality` / `test` / `smoke`.
- **Estructura:** Qué cambia → checklist (Make, docs, artefactos, CI).
- **Contenido a integrar según contexto:** Adapta el checklist a NEUBAT. No copies plantillas de otro producto. `test-vm` y `build-iso` son opt-in.

## Qué cambia

<!-- feat/fix/docs + alcance en una o dos frases -->

## Checklist

- [ ] `make lint && make test && make smoke && make validate`
- [ ] Si toca frontend: `make test-frontend && make build-frontend`
- [ ] Docs actualizadas (`README.md`, `ARCHITECTURE.md` o ADR si cambia contrato)
- [ ] Sin artefactos (`out/`, `portal/public/assets/`, `coverage/`) ni secretos
- [ ] CI `quality` / `test` / `smoke` en verde (`build` si aplica)
