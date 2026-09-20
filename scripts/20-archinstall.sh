#!/bin/bash
# =============================================================================
# NEUBAT - Fase 0b/2: obtención de configuración e instalación del sistema base
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
# =============================================================================

fetch_configuration() {
    log "Obteniendo configuración para token: ${NEUBAT_TOKEN}"

    NEUBAT_WORKDIR=$(mktemp -d -t neubat-XXXXXX)
    cd "${NEUBAT_WORKDIR}" || error "No se pudo crear el directorio de trabajo"

    NEUBAT_CONFIG_FILE="${NEUBAT_WORKDIR}/neubat-config.json"

    # Intentar descargar la configuración personalizada del portal
    if ! curl -sf --max-time 15 "${NEUBAT_PORTAL_URL}/api/config/${NEUBAT_TOKEN}" -o "${NEUBAT_CONFIG_FILE}"; then
        warning "Sin config personalizada; usando perfil local: ${NEUBAT_PROFILE}"
        cp "${NEUBAT_ROOT}/configs/${NEUBAT_PROFILE}.json" "${NEUBAT_CONFIG_FILE}"
    fi

    # Validar JSON
    if ! python3 -m json.tool "${NEUBAT_CONFIG_FILE}" &>/dev/null; then
        error "Configuración JSON inválida"
    fi

    # Extraer parámetros clave (sin jq: python3 garantizado en el ISO).
    # Estas variables se consumen en los módulos 10/30/40 (archivos sourced).
    # shellcheck disable=SC2034
    DISK=$(cfg_get "${NEUBAT_CONFIG_FILE}" disk "/dev/sda")
    # shellcheck disable=SC2034
    HOSTNAME=$(cfg_get "${NEUBAT_CONFIG_FILE}" hostname "neubat")
    # shellcheck disable=SC2034
    USERNAME=$(cfg_get "${NEUBAT_CONFIG_FILE}" username "neubat")
    # shellcheck disable=SC2034
    PASSWORD=$(cfg_get "${NEUBAT_CONFIG_FILE}" password "neubat")
    # shellcheck disable=SC2034
    DESKTOP=$(cfg_get "${NEUBAT_CONFIG_FILE}" desktop "none")
    # shellcheck disable=SC2034
    PACKAGES=$(cfg_get "${NEUBAT_CONFIG_FILE}" packages "")
    # shellcheck disable=SC2034
    TIMEZONE=$(cfg_get "${NEUBAT_CONFIG_FILE}" timezone "Europe/Madrid")
    # shellcheck disable=SC2034
    LOCALE=$(cfg_get "${NEUBAT_CONFIG_FILE}" locale "es_ES.UTF-8")
    # shellcheck disable=SC2034
    KEYMAP=$(cfg_get "${NEUBAT_CONFIG_FILE}" keyboard "es")

    if [[ "${PASSWORD}" == "neubat" ]]; then
        warning "Contraseña por defecto en uso. Cámbiala en el primer acceso."
    fi

    success "Configuración cargada: ${HOSTNAME} @ ${DISK} (perfil ${NEUBAT_PROFILE})"
}

install_base_system() {
    log "Instalando sistema base Arch Linux..."

    # Optimizar mirrors (España y vecinos prioritarios)
    log "Optimizando mirrors..."
    reflector --country Spain,Germany,France \
              --age 12 \
              --protocol https \
              --latest 20 \
              --sort rate \
              --save /etc/pacman.d/mirrorlist || warning "reflector falló; se usan los mirrors por defecto"

    # Paquetes esenciales
    log "Instalando paquetes base (esto puede tardar)..."
    pacstrap -K /mnt \
        base linux linux-firmware \
        btrfs-progs \
        grub efibootmgr \
        networkmanager network-manager-applet \
        sudo git base-devel \
        curl wget \
        inetutils \
        reflector \
        neovim nano \
        terminus-font \
        openssh

    # fstab
    log "Generando fstab..."
    genfstab -U /mnt >> /mnt/etc/fstab

    success "Sistema base instalado"
}
