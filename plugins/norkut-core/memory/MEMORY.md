# Memoria compartida Norkut — índice

> Hechos y decisiones, no opiniones. Cada línea con fecha y origen. Máximo 150 líneas acá; lo que crece va a su archivo.
> Cambios por PR con review del owner del módulo afectado (`modules.md`).

| Archivo | Qué tiene |
|---|---|
| `modules.md` | Módulo → repo(s) → owner → colecciones Mongo → eventos |
| `event-contracts.md` | Contratos de eventos de integración, con versión |
| `risks.md` | Riesgos conocidos y cómo se chequean |
| `workflow.md` | Flujo de features, estados de ClickUp, branch naming, roles |
| `gotchas.md` | Lo que rompe y por qué |
| `decisions/` | ADRs cross-cutting |

## Resumen (lo que todo agente tiene que saber)
- 2026-09 · onboarding · Norkut es una capa de visibilidad operativa para retail sobre sistemas existentes; POS offline-first; multitenant en AWS; múltiples países (fiscal Argentina incluido).
- 2026-09 · onboarding · Backend .NET con DDD + MediatR/CQRS en migración activa; MongoDB; componentes Python; frontend Angular (Front-Core + FrontFeatures-*); Hangfire para jobs; feed NuGet privado en Azure DevOps; Terraform.
- 2026-09 · onboarding · El código está repartido en varios repos de la org NorkutArg; una vertical toca más de un repo. Ver `modules.md`.
- 2026-09 · onboarding · Los 4 riesgos que siempre se evalúan: aislamiento multitenant, drift de contratos de eventos, colecciones Mongo compartidas, consistencia eventual. Ver `risks.md`.
- 2026-09 · decisión · Tracking en ClickUp (Space "Producto Norkut", un Folder por vertical). Branches y PRs llevan el ID de ClickUp. Ver `workflow.md`.
- 2026-09 · onboarding · El Arquitecto valida planes y es release manager; QA valida en staging después del merge.
