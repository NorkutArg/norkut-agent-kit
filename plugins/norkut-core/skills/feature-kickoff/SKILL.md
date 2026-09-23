---
name: feature-kickoff
description: Kickoff de una feature o epic de Norkut a partir de una tarea de ClickUp — identifica repos y módulos afectados, contratos de eventos que toca, colecciones Mongo compartidas, riesgos, dependencias entre verticales, y produce un plan para validar con el Arquitecto y el PM. Usar cuando una tarea pasa de backlog a planning o cuando alguien dice "arranquemos con X".
---

# Feature kickoff

Input: ID o URL de una tarea de ClickUp (Milestone o subtask), o una descripción si todavía no existe la tarea.

## Pasos

1. **Leer la tarea** con el MCP de ClickUp: título, descripción, vertical (Folder), subtasks existentes, campo Risk, Target Date. Estados y campos válidos: `${CLAUDE_PLUGIN_ROOT}/memory/workflow.md`. El plan Free corta en 100 llamadas por día: pedir la tarea con subtasks en una sola llamada y no recorrer listas enteras.
2. **Mapear impacto** con `norkut-context`:
   - Repos **y servicios** afectados (`${CLAUDE_PLUGIN_ROOT}/memory/modules.md`): un repo tiene varios servicios. Listar owners.
   - Eventos de integración que emite o consume (`${CLAUDE_PLUGIN_ROOT}/memory/event-contracts.md`). Si un contrato cambia, listar **todos** los repos que tienen copia del record (incluidos productores Python y Lambdas) con `/norkut-core:event-contract-check`.
   - Colecciones Mongo que toca y si alguna figura en "Colecciones compartidas" de `modules.md`.
   - Componentes Python o Hangfire involucrados.
3. **Riesgos**: pasar la feature por `${CLAUDE_PLUGIN_ROOT}/memory/risks.md` y marcar cuáles aplican y cómo se van a testear. Multitenant siempre se evalúa, aunque sea para descartarlo explícitamente.
4. **Dependencias**: otras tareas de ClickUp (mismo Folder u otro) que bloquean o son bloqueadas. Una sola búsqueda por keywords con el MCP; si hace falta más, preguntar al usuario.
5. **Definir criterios de aceptación** verificables en staging por QA. Si hay consistencia eventual, el criterio debe decir cuánto esperar y qué observar.
6. **Producir el plan** (formato abajo) y proponer las subtasks. No crearlas hasta que el usuario confirme.
7. Con confirmación: crear subtasks, mover la tarea a `planning`, comentar el plan en la tarea. Si el MCP devuelve límite diario alcanzado, entregar el plan y las subtasks como texto para cargarlos a mano.

## Formato del plan

```
## Plan — <título de la tarea> (CU-xxxx)

**Vertical:** … · **Owner sugerido:** … · **Risk:** Normal/Warning/Danger

### Repos y módulos
| Repo | Servicio | Owner | Cambio |

### Contratos de eventos
| Evento | Emite/Consume | ¿Cambia contrato? | ¿Aditivo? | Repos con copia del record |

### Colecciones Mongo
| Colección | Compartida con | Cambio de esquema |

### Riesgos que aplican y cómo se testean
- …

### Dependencias
- …

### Criterios de aceptación (verificables por QA en staging)
- …

### Subtasks propuestas
- [ ] …

### Preguntas para el Arquitecto / PM
- …
```

## Reglas
- No asumir ownership: si `modules.md` no lo dice, ponerlo como pregunta.
- Un cambio de contrato no aditivo (renombrar o borrar propiedades, cambiar tipo, nombre del record, namespace o `EndpointName`) es Risk = Danger. Uno aditivo con propiedades nuevas `required` o no nullable, también.
- El plan se valida con Arquitecto/PM antes de mover a `plan validated`. El skill solo mueve a `planning`.
