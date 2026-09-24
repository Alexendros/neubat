# NEUBAT - Post-instalación con Ansible

### Propósito de este documento

- **Objetivos:** Explicar el playbook de first-boot, qué toca en el sistema instalado y cómo validarlo en local.
- **Estructura:** Árbol `ansible/` → flujo first-boot → uso manual → validación (`make test-ansible`).
- **Contenido a integrar según contexto:** Adapta roles y variables generadas desde `configs/*.json`. No copies un playbook de otro host. No commitees `ansible/generated/`.

El directorio `ansible/` contiene el playbook de post-instalación que se ejecuta una sola vez en el primer arranque del sistema instalado.

## Estructura

```
ansible/
├── ansible.cfg                           # Configuración de Ansible
├── inventory/local.yml                   # Inventario de localhost
├── site.yml                              # Playbook principal
├── roles/neubat/                         # Rol de post-instalación
│   ├── defaults/main.yml                 # Variables por defecto
│   ├── handlers/main.yml                 # Handlers (reload systemd)
│   └── tasks/main.yml                    # Tareas del rol
│   └── templates/
│       ├── neubat-portal.service.j2      # Servicio del portal local
│       └── neubat-firstboot.service.j2   # Servicio one-shot de first-boot
└── run-firstboot.sh                      # Script invocado por systemd
```

## Flujo

1. Durante la instalación, `scripts/50-firstboot-ansible.sh` copia esta carpeta a `/opt/neubat-ansible` del sistema destino.
2. Genera `ansible/generated/neubat-ansible-vars.yml` a partir del JSON de configuración del portal/perfil.
3. Habilita `neubat-firstboot.service` con `ConditionFirstBoot=yes`.
4. Al arrancar por primera vez, systemd ejecuta `ansible-playbook site.yml`.
5. Ansible se encarga de:
   - Asegurar el usuario NEUBAT y los grupos necesarios.
   - Instalar los paquetes declarados en el perfil.
   - Habilitar/iniciar los servicios declarados.
   - Desplegar el portal local en `/opt/neubat-portal`.
   - Generar la URL única de setup en `~/NEUBAT-URL.txt`.

## Uso manual

```bash
cd ansible
ansible-playbook -i inventory/local.yml site.yml
```

Para probar con variables generadas:

```bash
python3 scripts/generate-ansible-vars.py \
  --config configs/base.json \
  --output ansible/generated/neubat-ansible-vars.yml
cd ansible
ansible-playbook -i inventory/local.yml site.yml
```

## Validación

```bash
make validate-ansible   # syntax-check
make lint-ansible       # ansible-lint (si está instalado)
make test-ansible       # ambos
```
