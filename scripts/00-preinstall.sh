#!/bin/bash
# =============================================================================
# NEUBAT - Fase 0: validaciones previas
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
# =============================================================================

check_requirements() {
    log "Verificando requisitos del sistema..."

    # Debe ejecutarse como root (live ISO o entorno de rescate)
    if [[ ${EUID} -ne 0 ]]; then
        error "Este script debe ejecutarse como root"
    fi

    # Conexión a Internet
    if ! ping -c 1 -W 3 archlinux.org &>/dev/null; then
        error "Sin conexión a Internet. Necesaria para la instalación por red."
    fi
    success "Conectividad a Internet"

    # Modo UEFI (requerido por el esquema de arranque del proyecto)
    if [[ ! -d /sys/firmware/efi ]]; then
        warning "Sistema no arrancado en modo UEFI; la instalación GRUB EFI fallará."
    else
        success "Modo UEFI detectado"
    fi

    # Herramientas necesarias en el entorno live
    local cmd
    for cmd in parted mkfs.btrfs mkfs.fat mkswap pacstrap genfstab arch-chroot python3 curl; do
        if ! command -v "${cmd}" &>/dev/null; then
            error "Falta la herramienta requerida: ${cmd} (usa el ISO oficial de Arch actualizado)"
        fi
    done
    success "Herramientas del entorno live verificadas"
}
