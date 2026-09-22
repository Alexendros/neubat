# NEUBAT — Roadmap y próximos pasos

## Estado actual (22 de septiembre de 2026)

| Prioridad | Tarea | Responsable | Estimación | Estado |
|-----------|-------|-------------|------------|--------|
| P0 | Desplegar servidor portal en entorno de pruebas | DevOps | 2h | ✅ Hecho (19-sep-2026) |
| P0 | Validar script iPXE en VM (VirtualBox/QEMU) | QA | 1h | ✅ Hecho parcialmente (19-sep-2026): cadena iPXE probada en QEMU — `dhcp` + `chain` al portal + descarga kernel/initrd + boot. La fase `archiso_http_srv` queda validada en red con DHCP real (QEMU slirp no responde a `ipconfig` de klibc) |
| P0 | Probar instalación completa en VM con disco NVMe virtual | QA | 2h | ✅ Hecho (19-sep-2026, perfil base en QEMU/NVMe: particionado, chroot, portal local y URL única verificados por SSH) |
| P1 | Crear imagen Docker del portal para distribución | Dev | 3h | ✅ Hecho (19-sep-2026) |
| P1 | Generación de ISO híbrida con hook de autoinstalación | Dev | 4h | ✅ Hecho (19-sep-2026) |
| P1 | Endurecer sudoers post-instalación (retirar NOPASSWD) | Dev | 1h | ✅ Hecho (19-sep-2026, automático al final de `30-postinstall.sh`) |
| P2 | Panel de administración web para seguimiento | Frontend | 8h | ✅ Hecho (19-sep-2026) |
| P1 | Publicar release v1.0.0 con ISO híbrida en GitHub | DevOps | 1h | ✅ Hecho (20-sep-2026) |
| P2 | Integración con Ansible para configuración post-instalación | DevOps | 6h | ✅ Hecho (20-sep-2026) |
| P1 | Rediseño GUI-UX con React + shadcn/ui | Frontend | 10h | ✅ Hecho (20-sep-2026) |
| P2 | Soporte de cifrado LUKS en particionado | Dev | 4h | ✅ Hecho (22-sep-2026, PR #17) |
| P3 | Snapshots btrfs automáticos pre/post actualización | Dev | 3h | ✅ Hecho (22-sep-2026, PR #18) |
| P2 | Firma y verificación de configuraciones (HMAC) | Dev | 3h | ✅ Hecho (22-sep-2026, PR #18) |
| P3 | Métricas de instalación reportadas al portal | Dev | 2h | ✅ Hecho (22-sep-2026, PR #18) |

## Próximos pasos sugeridos

| Prioridad | Tarea | Motivación | Estimación |
|-----------|-------|------------|------------|
| P1 | **Validación end-to-end de LUKS + snapper + HMAC en VM** | Confirmar que las nuevas fases funcionan juntas en un flujo real de instalación | 2h |
| P2 | **Exponer encryption/snapshots en el frontend** | El formulario web actual no deja elegir cifrado ni snapshots; solo se pueden configurar por API | 4h |
| P2 | **CI: añadir `make build-frontend` al workflow** | Garantizar que el build de producción nunca se rompa | 30 min |
| P2 | **Rotación automática del keyfile LUKS** | Tras el primer arranque, reemplazar el keyfile de `/boot` por una passphrase o enrolar TPM2/FIDO2 | 3h |
| P3 | **Servidor iPXE propio con imágenes cacheadas** | Independencia del mirror upstream de Arch y arranques más rápidos/repetibles | 6h |
| P3 | **Perfiles como paquetes versionados (`neubat-profile-*`)** | Distribuir perfiles por separado y permitir comunidad/contribuciones | 8h |
| P3 | **Métricas por fase de instalación** | Reportar duración de cada fase (particionado, pacstrap, chroot, etc.) para diagnóstico | 3h |
| P3 | **Integrar Proton Mail app en perfil production** | Cliente de correo cifrado; requiere AUR (`proton-mail`) | 1h |

## Ideas a evaluar

- Soporte para RAID/btrfs en múltiples discos.
- Instalaciones remotas con consola serie y watchdog.
- Dashboard en tiempo real de instalaciones en curso (WebSockets).
- Notificaciones por correo/Telegram al completar una instalación.
