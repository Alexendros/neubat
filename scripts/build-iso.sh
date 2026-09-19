#!/bin/bash
# =============================================================================
# NEUBAT - Generador de ISO híbrida con autoinstalación
# Construye una imagen Arch Linux (releng) personalizada que arranca el
# instalador NEUBAT cuando se le pasa neubat_token en el kernel cmdline.
#
# Uso: bash scripts/build-iso.sh [tag]
# Salida: out/neubat-<tag>-x86_64.iso
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAG="${1:-1.0.0}"
OUT_DIR="${ROOT_DIR}/out"
ISO_NAME="neubat-${TAG}-x86_64.iso"

mkdir -p "${OUT_DIR}"

echo "[build-iso] Construyendo ${ISO_NAME} con Docker + archiso ..."

# Se usa --privileged porque mkarchiso necesita montar filesystems/loops.
docker run --rm --privileged \
    -v "${OUT_DIR}:/out" \
    -v "${ROOT_DIR}:/src:ro" \
    archlinux:latest bash -c '
set -euo pipefail

echo "[build-iso] Actualizando e instalando archiso + reflector ..."
pacman -Sy --noconfirm --needed archiso reflector

# Usar mirrors europeos rápidos y desactivar el timeout por velocidad lenta.
echo "[build-iso] Optimizando mirrorlist ..."
reflector --country Germany,France,Netherlands,Spain \
          --age 24 --protocol https --sort rate \
          --connection-timeout 20 --download-timeout 20 \
          --save /etc/pacman.d/mirrorlist || true
grep -q "^DisableDownloadTimeout" /etc/pacman.conf || sed -i '/^\[options\]/a\\nDisableDownloadTimeout' /etc/pacman.conf
export PACMAN_TIMEOUT=120

WORK_DIR="$(mktemp -d -t neubat-work-XXXXXX)"
PROFILE_DIR="$(mktemp -d -t neubat-profile-XXXXXX)"
trap "rm -rf ${WORK_DIR} ${PROFILE_DIR}" EXIT

echo "[build-iso] Copiando perfil releng ..."
cp -a /usr/share/archiso/configs/releng/. "${PROFILE_DIR}/"
# Evitar abortos por red lenta durante la construcción.
grep -q "^DisableDownloadTimeout" "${PROFILE_DIR}/pacman.conf" || sed -i '/^\[options\]/a\\nDisableDownloadTimeout' "${PROFILE_DIR}/pacman.conf"
grep -q "^ParallelDownloads" "${PROFILE_DIR}/pacman.conf" || sed -i '/^\[options\]/a\\nParallelDownloads = 5' "${PROFILE_DIR}/pacman.conf"

echo "[build-iso] Inyectando NEUBAT en airootfs ..."
mkdir -p "${PROFILE_DIR}/airootfs/opt/neubat"
cp -a /src/. "${PROFILE_DIR}/airootfs/opt/neubat/"

# Reducir tamaño de la ISO eliminando artefactos no necesarios en runtime.
rm -rf "${PROFILE_DIR}/airootfs/opt/neubat/.git"
rm -rf "${PROFILE_DIR}/airootfs/opt/neubat/portal/node_modules"
rm -rf "${PROFILE_DIR}/airootfs/opt/neubat/out"
rm -rf "${PROFILE_DIR}/airootfs/opt/neubat/tests/vm"/*.qcow2 2>/dev/null || true

echo "[build-iso] Instalando servicio de autoinstalación ..."
cp /src/iso/airootfs/etc/systemd/system/neubat-autoinstall.service \
   "${PROFILE_DIR}/airootfs/etc/systemd/system/"
cp /src/iso/airootfs/usr/local/bin/neubat-autoinstall \
   "${PROFILE_DIR}/airootfs/usr/local/bin/"
chmod +x "${PROFILE_DIR}/airootfs/usr/local/bin/neubat-autoinstall"
mkdir -p "${PROFILE_DIR}/airootfs/etc/systemd/system/multi-user.target.wants"
ln -sf /etc/systemd/system/neubat-autoinstall.service \
       "${PROFILE_DIR}/airootfs/etc/systemd/system/multi-user.target.wants/neubat-autoinstall.service"

echo "[build-iso] Ejecutando mkarchiso (puede tardar varios minutos) ..."
mkarchiso -v -w "${WORK_DIR}" "${PROFILE_DIR}" "/out/'"${ISO_NAME}"'"

echo "[build-iso] ISO generada: /out/'"${ISO_NAME}"'"
'

echo "[build-iso] Listo: ${OUT_DIR}/${ISO_NAME}"
ls -lh "${OUT_DIR}/${ISO_NAME}"
