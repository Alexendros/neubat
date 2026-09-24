#!/usr/bin/env bash
# NEUBAT — Absorbe paquetes y dotfiles allowlist del sistema actual.
# Uso:
#   ./scripts/neubat-absorb.sh --code <codigo> --portal http://localhost:3000
set -euo pipefail

PORTAL=""
CODE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --portal) PORTAL="$2"; shift 2 ;;
    --code) CODE="$2"; shift 2 ;;
    -h|--help)
      echo "Uso: $0 --code <codigo> --portal <url>"
      exit 0
      ;;
    *) echo "Opción desconocida: $1"; exit 1 ;;
  esac
done

if [[ -z "$PORTAL" || -z "$CODE" ]]; then
  echo "Faltan --portal o --code" >&2
  exit 1
fi

if ! command -v pacman >/dev/null 2>&1; then
  echo "Este agente requiere pacman (Arch o derivado)." >&2
  exit 1
fi

DESKTOP="none"
if [[ -n "${XDG_CURRENT_DESKTOP:-}" ]]; then
  DESKTOP=$(echo "$XDG_CURRENT_DESKTOP" | tr '[:upper:]' '[:lower:]' | cut -d: -f1)
elif [[ -n "${DESKTOP_SESSION:-}" ]]; then
  DESKTOP=$(echo "$DESKTOP_SESSION" | tr '[:upper:]' '[:lower:]')
fi

LOCALE=$(grep -E '^LANG=' /etc/locale.conf 2>/dev/null | cut -d= -f2 || echo "es_ES.UTF-8")
KEYBOARD=$(localectl status 2>/dev/null | awk -F: '/VC Keymap/ {gsub(/ /,"",$2); print $2}' || echo "es")
TIMEZONE=$(timedatectl show -p Timezone --value 2>/dev/null || echo "Europe/Madrid")

export CODE DESKTOP LOCALE KEYBOARD TIMEZONE
PAYLOAD=$(python3 <<'PY'
import json, os, pathlib, subprocess
packages = []
try:
    out = subprocess.check_output(["pacman", "-Qe"], text=True)
    packages = [line.split()[0] for line in out.splitlines() if line.strip()]
except Exception:
    pass
allow = [
    ".bashrc", ".zshrc", ".profile", ".config/hypr", ".config/sway",
    ".config/i3", ".config/niri", ".config/kitty", ".config/foot",
    ".config/waybar", ".config/gtk-3.0", ".config/gtk-4.0",
]
home = pathlib.Path.home()
dotfiles = [p for p in allow if (home / p).exists()]
print(json.dumps({
    "code": os.environ["CODE"],
    "inventory": {
        "packages": packages,
        "desktop": os.environ.get("DESKTOP", "none"),
        "locale": os.environ.get("LOCALE", "es_ES.UTF-8"),
        "keyboard": os.environ.get("KEYBOARD", "es"),
        "timezone": os.environ.get("TIMEZONE", "Europe/Madrid"),
        "dotfiles": dotfiles,
    },
}))
PY
)

echo "Enviando inventario a ${PORTAL}/api/account/absorb …"
curl -sf -X POST "${PORTAL}/api/account/absorb" \
  -H 'Content-Type: application/json' \
  -d "${PAYLOAD}"
echo
echo "Listo. Confirma la copia en ${PORTAL}/cuenta"
