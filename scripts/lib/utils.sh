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
