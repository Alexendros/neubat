# NEUBAT — Roadmap y próximos pasos

| Prioridad | Tarea | Responsable | Estimación | Estado |
|-----------|-------|-------------|------------|--------|
| P0 | Desplegar servidor portal en entorno de pruebas | DevOps | 2h | ✅ Hecho (19-sep-2026) |
| P0 | Validar script iPXE en VM (VirtualBox/QEMU) | QA | 1h | ✅ Hecho parcialmente (19-sep-2026): cadena iPXE probada en QEMU — `dhcp` + `chain` al portal + descarga kernel/initrd + boot. La fase `archiso_http_srv` queda validada en red con DHCP real (QEMU slirp no responde a `ipconfig` de klibc) |
| P0 | Probar instalación completa en VM con disco NVMe virtual | QA | 2h | ✅ Hecho (19-sep-2026, perfil base en QEMU/NVMe: particionado, chroot, portal local y URL única verificados por SSH) |
| P1 | Crear imagen Docker del portal para distribución | Dev | 3h | ✅ Hecho (19-sep-2026) |
| P1 | Generación de ISO híbrida con hook de autoinstalación | Dev | 4h | ✅ Hecho (19-sep-2026) |
| P1 | Endurecer sudoers post-instalación (retirar NOPASSWD) | Dev | 1h | ✅ Hecho (19-sep-2026, automático al final de `30-postinstall.sh`) |
| P2 | Panel de administración web para seguimiento | Frontend | 8h | ✅ Hecho (19-sep-2026) |
| P2 | Integración con Ansible para configuración post-instalación | DevOps | 6h | Pendiente |
| P2 | Soporte de cifrado LUKS en particionado | Dev | 4h | Pendiente |
| P3 | Snapshots btrfs automáticos pre/post actualización | Dev | 3h | Pendiente |

## Ideas a evaluar

- Firma y verificación de configuraciones (tokens HMAC).
- Servidor iPXE propio con imágenes cacheadas (independencia del mirror upstream).
- Perfiles como paquetes versionados (`neubat-profile-*`).
- Métricas de instalación (duración por fase) reportadas al portal.
