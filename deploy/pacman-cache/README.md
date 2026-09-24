# Proxy caché de paquetes pacman (opcional)

### Propósito de este documento

- **Objetivos:** Explicar el perfil Docker opcional de caché pacman.
- **Estructura:** Motivo → arranque → uso con el portal.
- **Contenido a integrar según contexto:** No es required de CI. No copies un proxy de otro mirror.

Acelera instalaciones NEUBAT repetidas en VMs o redes locales: nginx cachea los
paquetes de un mirror upstream (los `.pkg.tar.*` son inmutables por versión) y
los sirve a velocidad de red local.

## Puesta en marcha (Docker)

```bash
docker run -d --name pacman-cache --restart unless-stopped \
  -p 8090:8090 \
  -v pacman-cache:/cache \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine
```

## Uso en clientes

En `/etc/pacman.d/mirrorlist` del entorno live (o del sistema instalado):

```
Server = http://<host-cache>:8090/$repo/os/$arch
```

Si se usa junto al instalador NEUBAT, conviene neutralizar `reflector` para que
no sobrescriba la mirrorlist (o apuntar reflector a conservarla).

## Comprobación

```bash
curl -sI http://localhost:8090/extra/os/x86_64/extra.db | grep -i x-cache
# 1ª vez: X-Cache: MISS — 2ª vez: X-Cache: HIT
```

## Notas

- Las bases de datos de repo (`*.db`, `*.files`) se cachean solo 5 minutos.
- Tamaño máximo de caché: 20 GB (`max_size` en `nginx.conf`).
- Upstream por defecto: `ftp.rediris.es` (RedIRIS, España). Cámbialo por tu
  mirror preferido editando `nginx.conf`.
