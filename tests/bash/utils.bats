#!/usr/bin/env bats
# =============================================================================
# NEUBAT - Tests unitarios de utilidades Bash
# =============================================================================

setup() {
    UTILS="${BATS_TEST_DIRNAME}/../../scripts/lib/utils.sh"
    [[ -f "${UTILS}" ]]
    # shellcheck source=scripts/lib/utils.sh
    source "${UTILS}"

    TMP_CONFIG="$(mktemp)"
    cat > "${TMP_CONFIG}" <<'JSON'
{
  "hostname": "neubat-test",
  "username": "tester",
  "packages": ["docker", "nodejs", "npm"],
  "desktop": "none",
  "missing": null,
  "encryption": {
    "enabled": true,
    "method": "keyfile",
    "passphrase": "secret"
  },
  "snapshots": {
    "enabled": false,
    "cleanup": {
      "hourly": 5,
      "daily": 7
    }
  }
}
JSON
}

teardown() {
    [[ -f "${TMP_CONFIG}" ]] && rm -f "${TMP_CONFIG}"
}

@test "part_name añade número directo para discos sin numeración" {
    [ "$(part_name /dev/sda 1)" = "/dev/sda1" ]
    [ "$(part_name /dev/vda 2)" = "/dev/vda2" ]
    [ "$(part_name /dev/xvdb 3)" = "/dev/xvdb3" ]
}

@test "part_name usa sufijo 'p' para discos con numeración" {
    [ "$(part_name /dev/nvme0n1 1)" = "/dev/nvme0n1p1" ]
    [ "$(part_name /dev/mmcblk0 2)" = "/dev/mmcblk0p2" ]
    [ "$(part_name /dev/loop0 1)" = "/dev/loop0p1" ]
}

@test "cfg_get devuelve valor de cadena" {
    [ "$(cfg_get "${TMP_CONFIG}" hostname)" = "neubat-test" ]
    [ "$(cfg_get "${TMP_CONFIG}" username)" = "tester" ]
    [ "$(cfg_get "${TMP_CONFIG}" desktop)" = "none" ]
}

@test "cfg_get devuelve valor por defecto cuando falta la clave" {
    [ "$(cfg_get "${TMP_CONFIG}" nonexistent "fallback")" = "fallback" ]
    [ "$(cfg_get "${TMP_CONFIG}" nonexistent)" = "" ]
}

@test "cfg_get devuelve lista como espacios" {
    [ "$(cfg_get "${TMP_CONFIG}" packages)" = "docker nodejs npm" ]
}

@test "cfg_get devuelve valor por defecto cuando el valor es null" {
    [ "$(cfg_get "${TMP_CONFIG}" missing "default")" = "default" ]
}

@test "reject_public_luks_secret bloquea neubat solo con cifrado" {
    run reject_public_luks_secret neubat true neubat
    [ "$status" -eq 1 ]
    run reject_public_luks_secret otra true neubat
    [ "$status" -eq 1 ]
    run reject_public_luks_secret neubat false ""
    [ "$status" -eq 0 ]
    run reject_public_luks_secret otra true "frase-larga"
    [ "$status" -eq 0 ]
    NEUBAT_ALLOW_DEFAULT_SECRETS=1 run reject_public_luks_secret neubat true neubat
    [ "$status" -eq 0 ]
}

@test "cfg_get_nested lee valores booleanos anidados" {
    [ "$(cfg_get_nested "${TMP_CONFIG}" encryption/enabled "false")" = "true" ]
    [ "$(cfg_get_nested "${TMP_CONFIG}" encryption.enabled "false")" = "true" ]
}

@test "cfg_get_nested lee cadenas anidadas" {
    [ "$(cfg_get_nested "${TMP_CONFIG}" encryption/method)" = "keyfile" ]
    [ "$(cfg_get_nested "${TMP_CONFIG}" encryption/passphrase)" = "secret" ]
}

@test "cfg_get_nested devuelve valor por defecto en rutas inexistentes" {
    [ "$(cfg_get_nested "${TMP_CONFIG}" encryption/nonexistent "fallback")" = "fallback" ]
    [ "$(cfg_get_nested "${TMP_CONFIG}" no/such/path "fallback")" = "fallback" ]
}

@test "cfg_get_nested lee rutas de tres niveles" {
    [ "$(cfg_get_nested "${TMP_CONFIG}" snapshots/cleanup/hourly "0")" = "5" ]
    [ "$(cfg_get_nested "${TMP_CONFIG}" snapshots.cleanup.daily "0")" = "7" ]
}
