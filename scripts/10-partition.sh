#!/bin/bash
# =============================================================================
# NEUBAT - Fase 1: particionado automático (GPT/UEFI, btrfs, NVMe-safe)
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
#
# Esquema resultante:
#   p1  EFI    512 MiB   FAT32   /boot/efi
#   p2  raíz   20-30 GiB btrfs   /
#   p3  home   resto-4G  btrfs   /home
#   p4  swap   4 GiB     swap
# =============================================================================

partition_disk() {
    log "Iniciando particionado de ${DISK}..."

    if [[ ! -b "${DISK}" ]]; then
        error "El disco ${DISK} no existe o no es un dispositivo de bloques"
    fi

    # Confirmación de destrucción de datos (omisible en modo totalmente desatendido)
    if [[ "${NEUBAT_ASSUME_YES:-false}" != "true" ]]; then
        warning "ESTO DESTRUIRÁ TODOS LOS DATOS EN ${DISK}"
        read -r -p "¿Continuar? [y/N] " -n 1
        echo
        [[ ! ${REPLY} =~ ^[Yy]$ ]] && error "Instalación cancelada por el usuario"
    fi

    local p_efi p_root p_home p_swap
    p_efi=$(part_name "${DISK}" 1)
    p_root=$(part_name "${DISK}" 2)
    p_home=$(part_name "${DISK}" 3)
    p_swap=$(part_name "${DISK}" 4)

    # Tamaños (en GiB) calculados con awk (bc no está garantizado en el ISO)
    local disk_gib swap_gib=4 root_gib home_end_gib
    disk_gib=$(blockdev --getsize64 "${DISK}" | awk '{printf "%d", $1/1073741824}')

    if (( disk_gib < 32 )); then
        error "Espacio insuficiente: ${disk_gib} GiB, mínimo 32 GiB requeridos"
    fi

    if (( disk_gib < 64 )); then
        root_gib=20
    else
        root_gib=30
    fi
    home_end_gib=$(( disk_gib - swap_gib ))

    log "Disco: ${disk_gib} GiB | raíz: ${root_gib} GiB | swap: ${swap_gib} GiB"

    # Limpiar sector de arranque y firmas previas
    log "Limpiando tabla de particiones previa..."
    wipefs -a "${DISK}"
    dd if=/dev/zero of="${DISK}" bs=1M count=10 status=none

    # Tabla GPT
    log "Creando tabla de particiones GPT..."
    parted -s "${DISK}" mklabel gpt

    # p1: EFI (512 MiB)
    log "Creando partición EFI..."
    parted -s "${DISK}" mkpart primary fat32 1MiB 513MiB
    parted -s "${DISK}" set 1 esp on

    # p2: raíz btrfs
    log "Creando partición raíz (${root_gib} GiB)..."
    parted -s "${DISK}" mkpart primary btrfs 513MiB "${root_gib}GiB"

    # p3: home btrfs (hasta disco - swap)
    log "Creando partición home (hasta ${home_end_gib} GiB)..."
    parted -s "${DISK}" mkpart primary btrfs "${root_gib}GiB" "${home_end_gib}GiB"

    # p4: swap
    log "Creando partición swap (${swap_gib} GiB)..."
    parted -s "${DISK}" mkpart primary linux-swap "${home_end_gib}GiB" 100%

    # Esperar a que el kernel relea la tabla
    partprobe "${DISK}" || true
    sleep 2

    # Formateo
    log "Formateando particiones..."
    mkfs.fat -F32 "${p_efi}"
    mkfs.btrfs -f -L "neubat_root" "${p_root}"
    mkfs.btrfs -f -L "neubat_home" "${p_home}"
    mkswap "${p_swap}"
    swapon "${p_swap}"

    # Montaje con opciones optimizadas para SSD
    log "Montando particiones..."
    mount -o noatime,compress=zstd,space_cache=v2 "${p_root}" /mnt
    mkdir -p /mnt/boot/efi /mnt/home
    mount "${p_efi}" /mnt/boot/efi
    mount -o noatime,compress=zstd,space_cache=v2 "${p_home}" /mnt/home

    success "Particionado completado"
}
