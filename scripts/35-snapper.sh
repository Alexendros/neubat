#!/bin/bash
# =============================================================================
# NEUBAT - Fase 7: snapshots automáticos de btrfs con snapper
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
# =============================================================================

# Configura snapper en / y /home cuando snapshots.enabled es true.
# Se ejecuta dentro del entorno instalado (arch-chroot /mnt).
configure_snapper() {
    [[ "${SNAPSHOTS_ENABLED:-false}" != "true" ]] && return 0

    log "Configurando snapshots btrfs automáticos (snapper)..."

    # snap-pac añade hooks de pacman para snapshots pre/post transacción
    arch-chroot /mnt pacman -S --noconfirm --needed snapper snap-pac \
        || warning "No se pudieron instalar snapper/snap-pac"

    # Crear configuraciones de snapper. En un chroot no hay bus D-Bus disponible;
    # --no-dbus evita el error org.freedesktop.DBus.Error.ServiceUnknown.
    arch-chroot /mnt snapper --no-dbus -c root create-config / \
        || warning "No se pudo crear configuración snapper para /"
    arch-chroot /mnt snapper --no-dbus -c home create-config /home \
        || warning "No se pudo crear configuración snapper para /home"

    # Aplicar límites de retención desde el perfil
    local root_cfg="/mnt/etc/snapper/configs/root"
    local home_cfg="/mnt/etc/snapper/configs/home"

    if [[ -f "${root_cfg}" ]]; then
        sed -i "s/^TIMELINE_LIMIT_HOURLY=.*/TIMELINE_LIMIT_HOURLY=\"${SNAP_KEEP_HOURLY}\"/" "${root_cfg}"
        sed -i "s/^TIMELINE_LIMIT_DAILY=.*/TIMELINE_LIMIT_DAILY=\"${SNAP_KEEP_DAILY}\"/" "${root_cfg}"
        sed -i "s/^TIMELINE_LIMIT_WEEKLY=.*/TIMELINE_LIMIT_WEEKLY=\"${SNAP_KEEP_WEEKLY}\"/" "${root_cfg}"
        sed -i "s/^TIMELINE_LIMIT_MONTHLY=.*/TIMELINE_LIMIT_MONTHLY=\"${SNAP_KEEP_MONTHLY}\"/" "${root_cfg}"
    fi

    if [[ -f "${home_cfg}" ]]; then
        sed -i "s/^TIMELINE_LIMIT_HOURLY=.*/TIMELINE_LIMIT_HOURLY=\"${SNAP_KEEP_HOURLY}\"/" "${home_cfg}"
        sed -i "s/^TIMELINE_LIMIT_DAILY=.*/TIMELINE_LIMIT_DAILY=\"${SNAP_KEEP_DAILY}\"/" "${home_cfg}"
        sed -i "s/^TIMELINE_LIMIT_WEEKLY=.*/TIMELINE_LIMIT_WEEKLY=\"${SNAP_KEEP_WEEKLY}\"/" "${home_cfg}"
        sed -i "s/^TIMELINE_LIMIT_MONTHLY=.*/TIMELINE_LIMIT_MONTHLY=\"${SNAP_KEEP_MONTHLY}\"/" "${home_cfg}"
    fi

    # Timers: timeline (crear snapshots) y cleanup (borrar antiguos)
    arch-chroot /mnt systemctl enable snapper-timeline.timer \
        || warning "No se pudo habilitar snapper-timeline.timer"
    arch-chroot /mnt systemctl enable snapper-cleanup.timer \
        || warning "No se pudo habilitar snapper-cleanup.timer"

    success "Snapshots configurados"
}
