---
name: dod-check
description: Checklist de definition of done de Norkut antes de mover una tarea de ClickUp a `qa testing` — PR mergeado y linkeado a la tarea, review sin bloqueantes, tenant y contratos verificados, tests, secretos, despliegue en staging y criterios de aceptación verificables por QA. Usar cuando alguien dice "¿ya puedo pasar a QA?", "terminé", al cerrar un PR, o antes de cambiar el estado de la tarea.
---

# Definition of done

Input: ID o URL de la tarea de ClickUp (`CU-xxxx`), o el branch/PR actual (el ID sale del nombre del branch). Transiciones y responsables: `${CLAUDE_PLUGIN_ROOT}/memory/workflow.md`.

## Pasos

1. **Reunir evidencia**, pidiendo lo justo (el MCP de ClickUp del plan Free corta en 100 llamadas por día):
   - La tarea con una sola llamada: estado, criterios de aceptación, subtasks, comentarios del plan.
   - El o los PRs linkeados (`gh pr list --search "CU-xxxx" --state all` en cada repo afectado, o el MCP de GitHub). Una feature puede tocar varios repos: un PR por repo, mismo nombre de branch.
   - Si ClickUp no responde o se alcanzó el límite, seguir con lo que haya y marcar esos ítems como "sin verificar".
2. **Recorrer el checklist** (✅ / ❌ / ⚠️ sin verificar / n/a), con evidencia concreta por ítem (link, archivo, comando).
3. **Veredicto**: `lista para qa testing` solo si no hay ❌. Un ⚠️ en tenant, contratos o secretos cuenta como ❌.
4. **No mover la tarea** sin confirmación del usuario. Con confirmación: mover a `qa testing` y comentar el checklist en la tarea.

## Checklist

| # | Ítem | Cómo se verifica |
|---|---|---|
| 1 | Branch y PR con `CU-<id>` | Nombre del branch o título del PR; la integración GitHub–ClickUp lo muestra en la tarea |
| 2 | PR mergeado al branch por defecto real de cada repo | `gh pr view <n> --json state,mergedAt,baseRefName`; no asumir `main` |
| 3 | `pr-review` sin bloqueantes | Comentario del review en el PR, o correr `/norkut-core:pr-review` ahora |
| 4 | Aislamiento de tenant | Si el cambio tocó persistencia: `/norkut-core:tenant-isolation-check` sin críticos |
| 5 | Contratos de eventos | Si tocó `IntegrationEvents/` o consumers/publishers Python: `/norkut-core:event-contract-check` con veredicto aditivo y todas las copias actualizadas |
| 6 | Colecciones compartidas | Si cambió el esquema de una colección de "Colecciones compartidas" en `modules.md`: aviso a los otros repos documentado en la tarea o el PR |
| 7 | Tests | Tests nuevos para la lógica nueva, espejando la capa (`*.Tests`, `tests/`); CI en verde. Si el repo no corre tests en CI, decirlo |
| 8 | Secretos y config | Nada hardcodeado en el diff; config nueva documentada con nombre de variable, no con valor |
| 9 | Desplegado en staging | Evidencia del deploy (workflow de GitHub Actions, tag de imagen). Los gates de staging no están documentados (`gotchas.md`): si no hay evidencia, preguntar al Arquitecto |
| 10 | `FrontFeatures-*` | Si el cambio vive en una lib `@mele/*`: paquete publicado y versión subida en `Front-Core`; si no, no está en staging |
| 11 | Criterios de aceptación verificables por QA | Cada criterio dice qué hacer y qué observar en staging. Si depende de un evento, dice cuánto esperar y dónde mirar (consistencia eventual) |
| 12 | Plan de validación | Si falta, generarlo con el agente `qa-staging` |

## Formato de salida

```
## DoD — <título de la tarea> (CU-xxxx)

**Veredicto:** lista para qa testing | faltan N ítems

| # | Ítem | Estado | Evidencia |
|---|---|---|---|
| 1 | Branch y PR con CU-id | ✅ | feature/CU-86abc123-… · PR #45 |
…

### Qué falta
- …
```

## Reglas
- No marcar ✅ sin evidencia. "Lo dijo el dev" no es evidencia; un link o un comando sí.
- El checklist se valida con el Arquitecto y el PM: si el equipo cambia la DoD, actualizar este skill y `workflow.md` en el mismo PR.
