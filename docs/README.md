# Documentación de NEUBAT

### Propósito de este documento

- **Objetivos:** Indexar la documentación de producto (arquitectura, guías y runbooks) y apuntar a los contratos de la raíz.
- **Estructura:** Tabla de rutas `docs/` → enlaces a README, AGENTS, ARCHITECTURE, CONTRIBUTING y SECURITY.
- **Contenido a integrar según contexto:** Adapta el índice al árbol de este repo. No copies guías de un SaaS ni de una CLI de bundles. El instalador y el portal son el producto; la ISO QEMU e2e es opt-in.

| Ruta | Para qué |
| ---- | -------- |
| [architecture/overview.md](./architecture/overview.md) | Flujo iPXE → portal → instalador |
| [architecture/decisions/](./architecture/decisions/) | ADRs (las decisiones vivas están en ARCHITECTURE.md) |
| [guides/install.md](./guides/install.md) | Documento maestro de instalación |
| [guides/desarrollo.md](./guides/desarrollo.md) | Arranque local y PR |
| [guides/ansible.md](./guides/ansible.md) | First-boot Ansible |
| [guides/packages.md](./guides/packages.md) | Paquetes por perfil |
| [guides/roadmap.md](./guides/roadmap.md) | Estado de fases y siguientes pasos |
| [runbooks/portal.md](./runbooks/portal.md) | Diagnóstico del portal y `/api/health` |
| [runbooks/iso.md](./runbooks/iso.md) | Construcción de la ISO híbrida |
| [runbooks/ci.md](./runbooks/ci.md) | Jobs `quality` / `test` / `build` / `smoke` |
| [RELEASE-v1.0.0.md](./RELEASE-v1.0.0.md) | Notas de la release v1.0.0 |

En la raíz: [README.md](../README.md), [AGENTS.md](../AGENTS.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [SECURITY.md](../SECURITY.md).
