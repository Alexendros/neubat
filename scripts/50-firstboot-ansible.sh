#!/bin/bash
# =============================================================================
# NEUBAT - Fase 6: preparación del runner Ansible de first-boot
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
# =============================================================================

prepare_ansible_firstboot() {
    log "Preparando post-instalación con Ansible..."

    local ansible_dest="/mnt/opt/neubat-ansible"
    local vars_file="${ansible_dest}/generated/neubat-ansible-vars.yml"

    # Copiar colección Ansible al sistema destino
    mkdir -p "${ansible_dest}"
    cp -r "${NEUBAT_ROOT}/ansible/"* "${ansible_dest}/"

    # Generar variables desde la configuración JSON del portal/perfil
    python3 "${NEUBAT_ROOT}/scripts/generate-ansible-vars.py" \
        --config "${NEUBAT_CONFIG_FILE}" \
        --output "${vars_file}"

    # Desplegar servicio systemd de first-boot
    sed -e "s|{{ playbook_dir }}/../configs/generated/neubat-ansible-vars.yml|${vars_file}|g" \
        "${ansible_dest}/roles/neubat/templates/neubat-firstboot.service.j2" \
        > /mnt/etc/systemd/system/neubat-firstboot.service

    arch-chroot /mnt systemctl enable neubat-firstboot.service

    success "Post-instalación Ansible preparada"
}
