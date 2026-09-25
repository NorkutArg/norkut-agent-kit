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
- 2026-09 · decisión · Nombre de branch: `[<tipo>/]CU-<id>_<descripcion-corta>_<Nombre-Apellido>`, p. ej. `CU-86e3cxn84_Scafolding-inicial_Diego-Ramirez` (el prefijo `feat/`, `fix/`… es opcional). Descripción: 2–5 palabras separadas por guiones, sin acentos. Nombre: `git config user.name` con espacios → guiones y sin acentos. `/norkut-core:start-task` lo arma solo.
- 2026-09 · decisión · La integración GitHub–ClickUp vincula branch, commit y PR si el ID `CU-<id>` aparece en su nombre, mensaje, título o descripción.
- 2026-09 · decisión · Estado desde un commit: `CU-<id>[<estado>]` en el mensaje, sin espacio entre el ID y el corchete, con un estado de la lista de arriba (sin distinguir mayúsculas), p. ej. `CU-86e3cxn84[in progress]`. Al empezar, `in progress`; al pasar a QA (después de `dod-check`), `qa testing`; `completed` y `Closed` según la tabla de transiciones.
- 2026-09 · decisión · Excepción: los branches `memory/<slug>` de `promote-learning` no tienen tarea de ClickUp.
- 2026-09 · decisión · PR: título con el ID, descripción con link a la tarea y checklist de `dod-check`.

## Roles
- 2026-09 · decisión · Arquitecto: valida planes, release manager, define fechas de producción.
- 2026-09 · decisión · PM (Diego): prioridad, riesgos cross-vertical, DoD.
- 2026-09 · decisión · QA: valida en staging después del merge.

- 2026-09 · decisión · ClickUp elegido sobre Plane y GitHub Projects.
