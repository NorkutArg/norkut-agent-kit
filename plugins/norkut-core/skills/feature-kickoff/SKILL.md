---
name: feature-kickoff
description: Kickoff de una feature o epic de Norkut a partir de una tarea de ClickUp — identifica repos y módulos afectados, contratos de eventos que toca, colecciones Mongo compartidas, riesgos, dependencias entre verticales, y produce un plan para validar con el Arquitecto y el PM. Usar cuando una tarea pasa de backlog a planning o cuando alguien dice "arranquemos con X".
---

# Feature kickoff

Input: ID o URL de una tarea de ClickUp (Milestone o subtask), o una descripción si todavía no existe la tarea.

## Pasos

1. **Leer la tarea** con el MCP de ClickUp: título, descripción, vertical (Folder), subtasks existentes, campo Risk, Target Date.
2. **Mapear impacto** con `norkut-context`:
   - Repos y módulos afectados (`modules.md`). Listar owners.
   - Eventos de integración que emite o consume (`event-contracts.md`). Marcar si el contrato cambia.
   - Colecciones Mongo que toca y si alguna es compartida con otro módulo.
   - Componentes Python o Hangfire involucrados.
3. **Riesgos**: pasar la feature por `risks.md` y marcar cuáles aplican y cómo se van a testear. Multitenant siempre se evalúa, aunque sea para descartarlo explícitamente.
4. **Dependencias**: otras tareas de ClickUp (mismo Folder u otro) que bloquean o son bloqueadas. Buscar por keywords con el MCP.
5. **Definir criterios de aceptación** verificables en staging por QA. Si hay consistencia eventual, el criterio debe decir cuánto esperar y qué observar.
6. **Producir el plan** (formato abajo) y proponer las subtasks. No crearlas hasta que el usuario confirme.
7. Con confirmación: crear subtasks, mover la tarea a `planning`, comentar el plan en la tarea.

## Formato del plan

```
## Plan — <título de la tarea> (CU-xxxx)

**Vertical:** … · **Owner sugerido:** … · **Risk:** Normal/Warning/Danger

### Repos y módulos
| Repo | Módulo | Owner | Cambio |

### Contratos de eventos
| Evento | Emite/Consume | ¿Cambia contrato? | Versión nueva |

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
- Un cambio de contrato de evento sin plan de compatibilidad hacia atrás es Risk = Danger.
- El plan se valida con Arquitecto/PM antes de mover a `plan validated`. El skill solo mueve a `planning`.
