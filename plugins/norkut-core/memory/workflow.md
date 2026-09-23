# Workflow de features

## Estados en ClickUp (Space "Producto Norkut")
`backlog → planning → plan validated → to do → in progress → qa testing → completed → Closed`

| Transición | Quién | Qué tiene que existir |
|---|---|---|
| backlog → planning | dev o PM | Kickoff hecho (`feature-kickoff`) |
| planning → plan validated | Arquitecto + PM | Plan aprobado en la tarea |
| to do → in progress | dev | Branch con ID de ClickUp |
| in progress → qa testing | dev | PR mergeado, `dod-check` ok, `pr-review` sin bloqueantes, desplegado en staging |
| qa testing → completed | QA | Criterios de aceptación validados en staging |
| completed → Closed | Arquitecto (release manager) | Incluido en release de producción |

## Estructura
- 2026-09 · ClickUp API · Un Folder por vertical: Integraciones, POS, Manejo Lotes, Bridge, Corporativo, Fidelización, Reposición Inteligente, Evolutivo. Cada uno con lista "Backlog".
- 2026-09 · ClickUp API · Además existe el Folder "Tooling" (lista "List"), fuera de las verticales. Los nombres de estados y campos de esta página no se verificaron contra la API todavía.
- 2026-09 · decisión · Epics = tareas tipo Milestone; el trabajo va como subtasks.
- 2026-09 · decisión · Campos: Risk (Normal / Warning / Danger), Target Date.
- 2026-09 · decisión · Bugs: lista "Inbox" a nivel Space, alimentada por Form con campo Origen (Cliente / Soporte / Interno / QA); triage diario los mueve al Folder de su vertical.

## Branches y PRs
- 2026-09 · decisión · Nombre de branch: `<tipo>/CU-<id>-<slug>` (p. ej. `feature/CU-86abc123-sync-stock`). La integración GitHub–ClickUp linkea automáticamente si el ID está en el branch o en el título del PR.
- 2026-09 · decisión · PR: título con el ID, descripción con link a la tarea y checklist de `dod-check`.

## Roles
- 2026-09 · decisión · Arquitecto: valida planes, release manager, define fechas de producción.
- 2026-09 · decisión · PM (Diego): prioridad, riesgos cross-vertical, DoD.
- 2026-09 · decisión · QA: valida en staging después del merge.

- 2026-09 · decisión · ClickUp elegido sobre Plane y GitHub Projects.
