# Decisiones de arquitectura

### Propósito de este documento

- **Objetivos:** Señalar dónde viven las decisiones de diseño y cuándo abrir un ADR numerado.
- **Estructura:** Estado actual → criterio para un ADR nuevo → plantilla mínima.
- **Contenido a integrar según contexto:** No copies ADRs de otro producto. Las decisiones vivas de NEUBAT (sin jq/bc, NVMe-safe, btrfs+zstd, tokens hex, HMAC) están en [ARCHITECTURE.md](../../../ARCHITECTURE.md).

Hasta que un cambio de contrato lo exija, **no hay ADRs numerados**. Resume y justifica en `ARCHITECTURE.md` y, si el cambio toca:

- el formato de `configs/*.json` o la validación de tokens,
- el contrato HMAC / LUKS / snapper,
- la API pública del portal (`/api/*`, `/boot/<token>`),
- o el particionado desatendido,

abre `NNNN-titulo.md` en este directorio en el mismo PR.

## Plantilla

```markdown
# NNNN — Título

Fecha: YYYY-MM-DD
Estado: propuesta | aceptada | supersedida

## Contexto
## Decisión
## Consecuencias
```
