#!/bin/bash
# =============================================================================
# NEUBAT - Fase 3: configuración del sistema (chroot) y aplicaciones
# Módulo cargado por neubat-install.sh (no ejecutar directamente)
# =============================================================================

configure_system() {
    log "Configurando sistema en chroot..."

    # La configuración viaja al chroot para trazabilidad (se borra al finalizar)
    cp "${NEUBAT_CONFIG_FILE}" /mnt/root/neubat-config.json

    # NOTA: el heredoc usa EOF sin comillas a propósito: las variables
    # (HOSTNAME, USERNAME, etc.) se expanden en el entorno live antes de
    # entrar al chroot.
    arch-chroot /mnt /bin/bash <<EOF
set -e

# Configuración regional
ln -sf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
hwclock --systohc

echo "${LOCALE} UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=${LOCALE}" > /etc/locale.conf
echo "KEYMAP=${KEYMAP}" > /etc/vconsole.conf

# Identidad NEUBAT (consumida por scripts/validate-install.sh)
cat > /etc/neubat-release <<REL
NEUBAT_VERSION=${NEUBAT_VERSION}
NEUBAT_PROFILE=${NEUBAT_PROFILE}
NEUBAT_TOKEN=${NEUBAT_TOKEN}
NEUBAT_INSTALL_DATE=$(date -Iseconds)
REL

# Hostname
echo "${HOSTNAME}" > /etc/hostname
cat > /etc/hosts <<HOSTS
127.0.0.1   localhost
::1         localhost
127.0.1.1   ${HOSTNAME}.local ${HOSTNAME}
HOSTS

# Usuario y contraseñas (parametrizadas desde la configuración)
useradd -m -G wheel -s /bin/bash ${USERNAME}
echo "${USERNAME}:${PASSWORD}" | chpasswd
echo "root:${PASSWORD}" | chpasswd

# Sudo: NOPASSWD temporal para poder construir paquetes AUR de forma
# desatendida. Endurecer tras la instalación (ver docs/INSTALL.md §9).
echo "%wheel ALL=(ALL:ALL) NOPASSWD: ALL" > /etc/sudoers.d/neubat
chmod 440 /etc/sudoers.d/neubat

# Initramfs
mkinitcpio -P

# GRUB (UEFI)
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=NEUBAT
grub-mkconfig -o /boot/grub/grub.cfg

# Servicios
systemctl enable NetworkManager
systemctl enable sshd

# AUR helper (yay) - no crítico: un fallo no aborta la instalación
su - ${USERNAME} -c '
    set -e
    cd /tmp
    git clone https://aur.archlinux.org/yay.git
    cd yay
    makepkg -si --noconfirm
' || echo "[WARNING] La construcción de yay falló; instálalo manualmente tras el primer arranque"

# Endurecer sudo: el NOPASSWD solo era necesario para la construcción
# desatendida de paquetes AUR; a partir de aquí wheel pide contraseña
echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/neubat
chmod 440 /etc/sudoers.d/neubat
rm -rf /tmp/yay
EOF

    success "Sistema configurado"
}

install_applications() {
    log "Instalando aplicaciones adicionales..."

    local desktop_packages=""
    case "${DESKTOP}" in
        "kde"|"plasma")
            desktop_packages="plasma-meta kde-applications-meta sddm"
            ;;
        "gnome")
            desktop_packages="gnome gnome-extra gdm"
            ;;
        "xfce")
            desktop_packages="xfce4 xfce4-goodies lightdm lightdm-gtk-greeter"
            ;;
        "none"|"minimal"|"")
            desktop_packages=""
            ;;
        *)
            warning "Desktop desconocido: ${DESKTOP}, usando mínimo"
            ;;
    esac

    if [[ -n "${desktop_packages}" ]]; then
        # Expansión sin comillas intencionada: lista de paquetes separada por espacios
        # shellcheck disable=SC2086
        arch-chroot /mnt pacman -S --noconfirm --needed ${desktop_packages}

        case "${DESKTOP}" in
            "kde"|"plasma") arch-chroot /mnt systemctl enable sddm ;;
            "gnome")        arch-chroot /mnt systemctl enable gdm ;;
            "xfce")         arch-chroot /mnt systemctl enable lightdm ;;
        esac
    fi

    # Paquetes de la configuración (ya incluyen los de infraestructura NEUBAT)
    if [[ -n "${PACKAGES}" ]]; then
        # Expansión sin comillas intencionada: lista de paquetes separada por espacios
        # shellcheck disable=SC2086
        arch-chroot /mnt pacman -S --noconfirm --needed ${PACKAGES} \
            || warning "Algunos paquetes personalizados fallaron (¿paquetes AUR en la lista?)"
    fi

    # Habilitar servicios declarados en la configuración
    local services
    services=$(cfg_get services "")
    local svc
    for svc in ${services}; do
        arch-chroot /mnt systemctl enable "${svc}" \
            || warning "No se pudo habilitar el servicio: ${svc}"
    done

    success "Aplicaciones instaladas"
}
