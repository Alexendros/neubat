# Runbook: portal NEUBAT

### Propósito de este documento

- **Objetivos:** Diagnosticar fallos del portal (arranque, health, creación de instalación, admin) sin tocar secretos reales.
- **Estructura:** Síntomas → comprobaciones → causas frecuentes → recuperación.
- **Contenido a integrar según contexto:** Adapta puertos y variables de `.env.example`. No copies un runbook de SaaS. No pegas tokens ni HMAC de producción en issues.

## Síntomas

- `docker compose` no levanta o el healthcheck falla
- `GET /api/health` no responde
- `POST /api/install` 4xx/5xx
- `/admin` rechaza el token

## Comprobaciones

```bash
make smoke
curl -sf http://localhost:3000/api/health
docker compose ps
docker compose logs portal --tail=80
```

Confirma que `ADMIN_TOKEN` y `NEUBAT_HMAC_SECRET` en el entorno coinciden con lo esperado (valores de ejemplo en `.env.example`, nunca secretos reales en el repo).

## Causas frecuentes

| Señal | Causa probable | Acción |
| ----- | -------------- | ------ |
| Puerto ocupado | `NEUBAT_PORT` / `PORT` en uso | Cambia el puerto o mata el proceso |
| Healthcheck Docker | portal aún no ha llamado a `db.initStorage()` | Revisa logs; el `start_period` es 10 s |
| 401/403 en `/admin` | `ADMIN_TOKEN` vacío o distinto | Exporta el token y reinicia |
| HMAC inválido en el live | secreto distinto portal vs instalador | Alinea `NEUBAT_HMAC_SECRET` |

## Recuperación

1. Para el contenedor o el proceso Node.
2. No borres `portal/data/` en un entorno con instalaciones reales.
3. En local de desarrollo, puedes vaciar `portal/data/` y `portal/configs/generated/` (están en `.gitignore`).
4. Vuelve a `make smoke` antes de reintentar iPXE/ISO.
