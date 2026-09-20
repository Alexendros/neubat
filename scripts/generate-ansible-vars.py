#!/usr/bin/env python3
"""
Genera variables de Ansible a partir de la configuración JSON de NEUBAT.

Uso:
    python3 scripts/generate-ansible-vars.py \
        --config configs/production.json \
        --output ansible/generated/neubat-ansible-vars.yml
"""

import argparse
import json
import os


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera vars de Ansible para NEUBAT")
    parser.add_argument("--config", required=True, help="Ruta al JSON de configuración")
    parser.add_argument("--output", required=True, help="Ruta al fichero YAML de salida")
    args = parser.parse_args()

    with open(args.config, encoding="utf-8") as f:
        cfg = json.load(f)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    packages = cfg.get("packages", [])
    services = cfg.get("services", [])

    lines = [
        "---",
        "# Auto-generado por scripts/generate-ansible-vars.py",
        f"neubat_username: {cfg.get('username', 'neubat')}",
        f"neubat_hostname: {cfg.get('hostname', 'neubat')}",
        f"neubat_profile: {cfg.get('profile', 'production')}",
        f"neubat_desktop: {cfg.get('desktop', 'none')}",
        "neubat_packages:",
    ]
    for pkg in packages:
        lines.append(f"  - {pkg}")
    lines.append("neubat_services:")
    for svc in services:
        lines.append(f"  - {svc}")

    with open(args.output, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Variables escritas en: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
