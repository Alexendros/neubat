#!/bin/bash
# =============================================================================
# NEUBAT - Fase 1: particionado automático (GPT/UEFI, btrfs, NVMe-safe)
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
#
# Esquema resultante:
#   p1  EFI/boot  1 GiB   FAT32   /boot  (también /boot/efi para UEFI)
#   p2  raíz      19-29 GiB btrfs   /
#   p3  home      resto-4G  btrfs   /home
#   p4  swap      4 GiB     swap
#
# La partición EFI se monta directamente en /boot para simplificar el arranque:
# GRUB/systemd-boot leen kernel, initramfs y su configuración desde una única
# partición FAT32 accesible sin cifrado. /boot/efi es simplemente el subdirectorio
# EFI dentro de esa partición.
#
# Cuando encryption.enabled es true, p2/p3 se convierten a contenedores
# LUKS y el sistema de archivos btrfs vive dentro de /dev/mapper/neubat_*.
# =============================================================================

# Crea (o reutiliza) un contenedor LUKS en la partición indicada y lo abre
# con el mapper dado. El modo desatendido requiere un keyfile generado
# previamente; si no existe, se usa passphrase interactiva.
_setup_luks_container() {
    local partition="$1" mapper="$2"
    local cryptargs=(--type luks2 --cipher "${LUKS_CIPHER}" --key-size "${LUKS_KEY_SIZE}" --pbkdf argon2id --batch-mode)

    log "Creando contenedor LUKS ${mapper} en ${partition}"

    if [[ -n "${LUKS_KEYFILE:-}" && -f "${LUKS_KEYFILE}" ]]; then
        cryptsetup luksFormat "${partition}" "${LUKS_KEYFILE}" "${cryptargs[@]}"
        cryptsetup open "${partition}" "${mapper}" --key-file "${LUKS_KEYFILE}"
    else
        if [[ -z "${LUKS_PASSPHRASE:-}" ]]; then
            error "Cifrado activo pero no hay keyfile ni passphrase configurada"
        fi
        # shellcheck disable=SC2086
        printf '%s' "${LUKS_PASSPHRASE}" | cryptsetup luksFormat "${partition}" - "${cryptargs[@]}"
        # shellcheck disable=SC2086
        printf '%s' "${LUKS_PASSPHRASE}" | cryptsetup open "${partition}" "${mapper}" -
    fi
}

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

    # Dispositivos que finalmente se formatearán/montarán (pueden ser mappers)
    local fs_root="${p_root}" fs_home="${p_home}"

    # Tamaños (en GiB) calculados con awk (bc no está garantizado en el ISO)
    local disk_gib swap_gib=4 efi_gib=1 root_gib home_end_gib
    disk_gib=$(blockdev --getsize64 "${DISK}" | awk '{printf "%d", $1/1073741824}')

    if (( disk_gib < 32 )); then
        error "Espacio insuficiente: ${disk_gib} GiB, mínimo 32 GiB requeridos"
    fi

    if (( disk_gib < 64 )); then
        root_gib=19
    else
        root_gib=29
    fi
    home_end_gib=$(( disk_gib - swap_gib ))

    # Límite en MiB para la partición EFI/boot (1 GiB = 1024 MiB)
    local efi_end_mib=1025
    local root_end_gib=$(( efi_gib + root_gib ))

    log "Disco: ${disk_gib} GiB | EFI/boot: ${efi_gib} GiB | raíz: ${root_gib} GiB | swap: ${swap_gib} GiB"

    # Limpiar sector de arranque y firmas previas
    log "Limpiando tabla de particiones previa..."
    wipefs -a "${DISK}"
    dd if=/dev/zero of="${DISK}" bs=1M count=10 status=none

    # Tabla GPT
    log "Creando tabla de particiones GPT..."
    parted -s "${DISK}" mklabel gpt

    # p1: EFI + /boot (1 GiB, FAT32)
    log "Creando partición EFI/boot (${efi_gib} GiB)..."
    parted -s "${DISK}" mkpart primary fat32 1MiB "${efi_end_mib}MiB"
    parted -s "${DISK}" set 1 esp on

    # p2: raíz btrfs
    log "Creando partición raíz (${root_gib} GiB)..."
    parted -s "${DISK}" mkpart primary btrfs "${efi_end_mib}MiB" "${root_end_gib}GiB"

    # p3: home btrfs (hasta disco - swap)
    log "Creando partición home (hasta ${home_end_gib} GiB)..."
    parted -s "${DISK}" mkpart primary btrfs "${root_end_gib}GiB" "${home_end_gib}GiB"

    # p4: swap
    log "Creando partición swap (${swap_gib} GiB)..."
    parted -s "${DISK}" mkpart primary linux-swap "${home_end_gib}GiB" 100%

    # Esperar a que el kernel relea la tabla
    partprobe "${DISK}" || true
    sleep 2

    # Cifrado opcional de raíz y home (EFI/boot se mantiene en claro)
    if [[ "${ENCRYPTION_ENABLED:-false}" == "true" ]]; then
        if ! command -v cryptsetup &>/dev/null; then
            error "cryptsetup no está disponible en el entorno live; necesario para LUKS"
        fi

        _setup_luks_container "${p_root}" "neubat_root"
        _setup_luks_container "${p_home}" "neubat_home"

        fs_root="/dev/mapper/neubat_root"
        fs_home="/dev/mapper/neubat_home"

        success "Contenedores LUKS abiertos"
    fi

    # Formateo
    log "Formateando particiones..."
    mkfs.fat -F32 "${p_efi}"
    mkfs.btrfs -f -L "neubat_root" "${fs_root}"
    mkfs.btrfs -f -L "neubat_home" "${fs_home}"
    mkswap "${p_swap}"
    swapon "${p_swap}"

    # Montaje: /boot es la partición EFI; /boot/efi es un subdirectorio.
    # Esto simplifica el arranque porque GRUB lee /boot/grub desde la misma
    # partición FAT32 donde vive el binario EFI.
    log "Montando particiones..."
    mount -o noatime,compress=zstd,space_cache=v2 "${fs_root}" /mnt
    mkdir -p /mnt/boot /mnt/home
    mount "${p_efi}" /mnt/boot
    mkdir -p /mnt/boot/efi
    mount -o noatime,compress=zstd,space_cache=v2 "${fs_home}" /mnt/home

    success "Particionado completado"
}
