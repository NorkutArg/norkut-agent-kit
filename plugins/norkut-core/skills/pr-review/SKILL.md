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
| Multitenant | .NET: toda query nueva lleva `.WithTenant(...)` (DAO que hereda de `TenantDao<T>`, tenant desde `IContextService.SubscriptionId`) o un `.NonTenant()` justificado. Python: todo pipeline arranca con `$match` por `TenantId`. Nunca tenant tomado del request. Ver `${CLAUDE_PLUGIN_ROOT}/memory/risks.md` |
| Contratos de eventos | Si toca un `record` de `namespace IntegrationEvents.Events`: solo cambios aditivos, propiedades nuevas nullable y sin `required`, sin renombrar tipo, namespace ni `EndpointName`. Consumidores en `${CLAUDE_PLUGIN_ROOT}/memory/event-contracts.md`; confirmar todas las copias con `/norkut-core:event-contract-check` |
| Colecciones compartidas | Cambios de esquema en colecciones de "Colecciones compartidas" de `${CLAUDE_PLUGIN_ROOT}/memory/modules.md` → ¿se avisó a los otros repos? |
| Consistencia eventual | ¿El feature asume lectura inmediata después de escribir vía evento? ¿Los criterios de aceptación lo contemplan? |
| Capas y conector | `*.Domain` sin `Microsoft.AspNetCore.*` ni `MongoDbQueryBuilder`; controllers delgados; mapeo solo por `IMapper`; todo acceso a Mongo por el conector (nunca `IMongoCollection`), sin mezclar `BackAegis.MongoDbConnector` con `MongoDbConnector` en un servicio; nombres de colección desde `Collections`. Angular: sin `HttpClient` directo en componentes |
| Secretos y config | Nada hardcodeado; connection strings y tokens por configuración |
| Consumers idempotentes | Consumers nuevos o modificados toleran reentrega (upsert o chequeo de existencia); revisar también `IConsumer<Batch<X>>` |
| Paquetes | Paquetes y versiones nuevas existen de verdad; verificar contra `.csproj` / `package.json` / `requirements.txt` del servicio |
| Tests | Tests en `*.Tests` espejando la capa; test explícito de aislamiento de tenant si tocó DAOs |
| Hangfire | Jobs nuevos: idempotentes, con reintentos acotados; el storage es en memoria (`${CLAUDE_PLUGIN_ROOT}/memory/gotchas.md`) |
| ClickUp | Branch/PR con ID `CU-xxxx` (`${CLAUDE_PLUGIN_ROOT}/memory/workflow.md`); la tarea está en `in progress` |
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
- Un ❌ en Multitenant o Contratos es bloqueante siempre. Si el diff toca persistencia o eventos, delegar el detalle en `/norkut-core:tenant-isolation-check` y `/norkut-core:event-contract-check`.
- `FrontFeatures-*`: el merge no llega a producción; en "Para QA" recordar que hay que publicar el paquete y subir la versión en `Front-Core`.
- No comentar estilo si el linter ya lo cubre.
- Si el diff es demasiado grande para leerlo entero, decirlo y revisar por archivo priorizando repositorios, handlers y eventos.
