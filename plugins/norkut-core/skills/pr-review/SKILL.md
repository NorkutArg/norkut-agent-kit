---
name: pr-review
description: Revisar un PR de Norkut contra la lista de riesgos conocidos y la definition of done — aislamiento multitenant, drift de contratos de eventos, colecciones Mongo compartidas, consistencia eventual, secretos, tests, y linkeo con ClickUp. Produce un comentario estructurado listo para pegar en GitHub. Usar cuando alguien pide review, antes de mover a qa testing, o cuando hay que revisar PRs generados con IA rápido y con criterio.
---

# PR review

Input: URL o número de PR y repo. Si no está dado, usar el branch actual.

## Pasos

1. **Obtener el diff** con el MCP de GitHub (o `gh pr diff` si está disponible). Leer descripción y tarea de ClickUp linkeada.
2. **Chequeos obligatorios** (marcar cada uno como ✅ / ⚠️ / ❌ / n/a):

| Chequeo | Qué mirar |
|---|---|
| Multitenant | Toda query/command a Mongo filtra por tenant. Handlers que reciben `TenantId` del contexto y no del request. Ver `risks.md` |
| Contratos de eventos | Si toca un evento de `event-contracts.md`: ¿bump de versión? ¿consumidores actualizados o compatibles? ¿`event-contracts.md` actualizado? |
| Colecciones compartidas | Cambios de esquema en colecciones que `modules.md` marca como compartidas → ¿se avisó al otro owner? |
| Consistencia eventual | ¿El feature asume lectura inmediata después de escribir vía evento? ¿Los criterios de aceptación lo contemplan? |
| DDD / CQRS | Lógica de dominio en aggregates, no en handlers; commands y queries separados; nada de acceso a Mongo desde controllers |
| Secretos y config | Nada hardcodeado; connection strings y tokens por configuración |
| Tests | Tests unitarios de la lógica nueva; test explícito de aislamiento de tenant si tocó repositorios |
| Hangfire | Jobs nuevos: idempotentes, con reintentos acotados; recordar que el storage actual es en memoria |
| Observabilidad | Logs estructurados con tenant y correlation id en paths nuevos |
| ClickUp | Branch/PR con ID `CU-xxxx`; la tarea está en `in progress` |
| Tamaño | > 400 líneas de diff sin justificación → sugerir partir |

3. **Riesgo global** del PR: Normal / Warning / Danger, con una línea de justificación.
4. **Producir el comentario** (formato abajo). No publicarlo en GitHub sin confirmación.

## Formato del comentario

```
## Review — <título del PR>

**Riesgo:** Normal | Warning | Danger — <por qué>

### Chequeos
| Chequeo | Estado | Nota |
| Multitenant | ✅ | … |
…

### Bloqueantes
- …

### Sugerencias
- …

### Para QA en staging
- <qué validar y cómo, incluyendo esperas por consistencia eventual>
```

## Reglas
- Un ❌ en Multitenant o Contratos es bloqueante siempre.
- No comentar estilo si el linter ya lo cubre.
- Si el diff es demasiado grande para leerlo entero, decirlo y revisar por archivo priorizando repositorios, handlers y eventos.
