---
name: norkut-context
description: Cargar contexto compartido de Norkut — qué módulo vive en qué repo y quién lo ownea, contratos de eventos de integración, riesgos conocidos (multitenant, drift de contratos, colecciones Mongo compartidas, consistencia eventual), workflow de features y estados de ClickUp, gotchas de infra. Usar siempre que una tarea toque más de un módulo, una colección de Mongo, un evento de integración, o cuando haya que decidir a quién consultar.
---

# Contexto compartido Norkut

La memoria cross-repo vive en `${CLAUDE_PLUGIN_ROOT}/memory/`. No leer todo: empezar por `MEMORY.md` y saltar al archivo que corresponde.

| Pregunta | Archivo |
|---|---|
| ¿Qué módulo/repo toca esto? ¿Quién es el owner? ¿Qué colecciones usa? | `memory/modules.md` |
| ¿Qué eventos emite/consume? ¿Qué versión del contrato? | `memory/event-contracts.md` |
| ¿Qué puede romperse? ¿Cómo lo chequeo? | `memory/risks.md` |
| ¿En qué estado de ClickUp va? ¿Cómo nombro el branch? ¿Quién valida? | `memory/workflow.md` |
| ¿Por qué esto falla en staging / al instalar / al deployar? | `memory/gotchas.md` |
| ¿Por qué se decidió X? | `memory/decisions/` |

## Reglas
- Citar el archivo y la línea de origen cuando la respuesta sale de la memoria.
- Si la memoria está desactualizada o falta algo, decirlo y proponer correr `/norkut-core:promote-learning` en vez de inventar.
- Ante una colección de Mongo compartida por más de un módulo (`modules.md`), avisar siempre antes de modificar su esquema.
