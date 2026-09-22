#!/bin/bash
# =============================================================================
# NEUBAT - Utilidades compartidas de los scripts de instalación
# Funciones puras reutilizables; puede cargarse sin ejecutar el instalador.
# =============================================================================

# Sufijo de partición: /dev/sda -> /dev/sda1, /dev/nvme0n1 -> /dev/nvme0n1p1
part_name() {
    local disk="$1" num="$2"
    if [[ "${disk}" =~ [0-9]$ ]]; then
        echo "${disk}p${num}"
    else
        echo "${disk}${num}"
    fi
}

# Lectura de claves JSON sin jq (python3 está garantizado en el ISO de Arch)
# Uso: cfg_get <archivo> <clave> [valor_por_defecto]
cfg_get() {
    python3 - "$1" "$2" "${3:-}" <<'PYEOF'
import json, sys
with open(sys.argv[1]) as f:
    cfg = json.load(f)
val = cfg.get(sys.argv[2])
if val is None:
    print(sys.argv[3])
elif isinstance(val, list):
    print(' '.join(str(v) for v in val))
else:
    print(val)
PYEOF
}

# Lectura de claves anidadas (objetos dentro de objetos).
# Soporta separadores '/' o '.'. Ejemplo: cfg_get_nested cfg.json encryption/enabled false
# Uso: cfg_get_nested <archivo> <ruta> [valor_por_defecto]
cfg_get_nested() {
    python3 - "$1" "$2" "${3:-}" <<'PYEOF'
import json, sys
with open(sys.argv[1]) as f:
    cfg = json.load(f)
path = sys.argv[2].replace('/', '.').split('.')
default = sys.argv[3]
val = cfg
for key in path:
    if not isinstance(val, dict) or key not in val:
        print(default)
        sys.exit(0)
    val = val[key]
if val is None:
    print(default)
elif isinstance(val, bool):
    print("true" if val else "false")
elif isinstance(val, list):
    print(' '.join(str(v) for v in val))
else:
    print(val)
PYEOF
}
