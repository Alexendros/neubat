#!/bin/bash
# =============================================================================
# NEUBAT - First-boot Ansible runner
# Se ejecuta una sola vez en el primer arranque del sistema instalado.
# =============================================================================
set -euo pipefail

ANSIBLE_DIR="/opt/neubat-ansible"
LOG="/var/log/neubat-firstboot.log"

exec >> "${LOG}" 2>&1

echo "[$(date -Iseconds)] Iniciando post-instalación con Ansible"

cd "${ANSIBLE_DIR}"
ansible-playbook -i inventory/local.yml site.yml

echo "[$(date -Iseconds)] Ansible completado; deshabilitando servicio first-boot"
systemctl disable neubat-firstboot.service
rm -f /etc/systemd/system/neubat-firstboot.service
