#!/bin/bash
# =============================================================================
# NEUBAT - Checklist de validación post-instalación
# Ejecutar en el sistema YA instalado: bash scripts/validate-install.sh
# =============================================================================

# SC2015: el patrón "test && ok || fail" es seguro aquí porque ok() siempre
# devuelve 0.
# shellcheck disable=SC2015

ok()   { echo "✓ $1"; }
fail() { echo "✗ $1"; FAILURES=$((FAILURES+1)); }
warn() { echo "⚠ $1"; }

FAILURES=0

echo "=== VALIDACIÓN NEUBAT ==="

# Sistema base
[[ -f /etc/neubat-release ]] \
    && ok "Versión NEUBAT registrada ($(grep NEUBAT_VERSION /etc/neubat-release | cut -d= -f2))" \
    || fail "Falta /etc/neubat-release"

[[ $(cat /etc/hostname) == neubat* ]] \
    && ok "Hostname correcto ($(cat /etc/hostname))" \
    || fail "Hostname inesperado: $(cat /etc/hostname)"

# Usuario configurado
NEUBAT_USER=$(awk -F: '$3 >= 1000 && $3 < 65534 {print $1; exit}' /etc/passwd)
[[ -n "${NEUBAT_USER}" ]] \
    && ok "Usuario no-root existe: ${NEUBAT_USER}" \
    || fail "No existe usuario no-root"

# Red
ping -c1 -W3 archlinux.org &>/dev/null && ok "Conectividad Internet" || fail "Sin Internet"

# Servicios
for svc in NetworkManager sshd; do
    systemctl is-active "${svc}" &>/dev/null && ok "${svc} activo" || fail "${svc} inactivo"
done

if systemctl list-unit-files docker.service &>/dev/null; then
    systemctl is-active docker &>/dev/null && ok "Docker activo" || warn "Docker instalado pero inactivo"
fi

# Portal local
curl -sf --max-time 5 http://localhost:3000/api/health &>/dev/null \
    && ok "Portal local respondiendo" \
    || fail "Portal no responde en :3000"

# Disco raíz
uso=$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
if (( uso < 80 )); then
    ok "Espacio en disco raíz OK (${uso}%)"
else
    warn "Disco raíz casi lleno (${uso}%)"
fi

# fstab coherente
grep -q " / " /etc/fstab && ok "fstab contiene raíz" || fail "fstab sin entrada de raíz"

echo "========================="
if (( FAILURES > 0 )); then
    echo "Resultado: ${FAILURES} comprobación(es) fallidas"
    exit 1
fi
echo "Resultado: todas las comprobaciones superadas"
