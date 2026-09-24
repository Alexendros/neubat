# Contrato de tokens NEUBAT

Versión: **1.0**

Formato: W3C DTCG. Color en OKLCH. Paleta propia de NEUBAT (azules de la SPA), no la de otro producto.

## Hojas

| Fichero | Contenido |
| --- | --- |
| `primitive.color.tokens.json` | `brand`, `neutral`, `success`, `warning`, `danger`, `focus` |
| `semantic.color.tokens.json` | `bg`, `text`, `border`, `action`, `feedback` con modos `light` y `dark` |
| `primitive.dimension.tokens.json` | `space`, `radius`, `shadow`, `motion`, `z`, `breakpoint` |
| `semantic.typography.tokens.json` | familia, peso, tamaño, interlineado, tracking |
| `component.alias.tokens.json` | `button`, `card`, `input` → semánticos |

Cada hoja lleva `$meta.version` `"1.0"`. Las referencias usan `{grupo.token}`.

## Build

```bash
node portal/frontend/scripts/build-tokens.mjs
node portal/frontend/scripts/build-tokens.mjs --check
node portal/frontend/scripts/check-contrast.mjs
```

El generador es Node puro (sin dependencias). Escribe `tokens/generated/variables.css` y `tokens/generated/fallback-hex.json`.

`src/index.css` mapea las variables de la SPA (`--background`, `--primary`, radios, fuentes) a `--nb-*`. Los componentes no repiten `oklch()` literales. El hex solo aparece como fallback de `@supports not (color: oklch(0% 0 0))` y como entrada del gate de contraste.

## Contraste

Texto sobre fondo ≥ 4.5:1. Bordes, anillo de foco y demás UI ≥ 3:1. Se evalúa en claro y en oscuro. `make smoke` ejecuta el check y falla si el CSS generado no está al día.

## Tema

`html.dark` activa el modo oscuro. Sin preferencia guardada se sigue `prefers-color-scheme`. `prefers-reduced-motion: reduce` acorta las duraciones de `motion` a `0.01ms` y anula animaciones en `index.css`.
