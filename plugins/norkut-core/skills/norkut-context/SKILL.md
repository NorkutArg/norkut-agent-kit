---
name: norkut-context
description: Cargar contexto compartido de Norkut — qué repo y servicio implementa cada módulo y quién lo ownea, qué colecciones de Mongo comparten varios módulos, qué eventos de integración emite y consume cada repo, riesgos conocidos (multitenant, drift de contratos, colecciones compartidas, consistencia eventual), workflow de features y estados de ClickUp, gotchas de infra. Usar siempre que una tarea toque más de un módulo, una colección de Mongo o un evento de integración, cuando pregunten "¿quién usa la colección X?", "¿quién consume el evento Y?", "¿de quién es este módulo?", o cuando haya que decidir a quién consultar.
---

# Contexto compartido Norkut

La memoria cross-repo vive en `${CLAUDE_PLUGIN_ROOT}/memory/`. No leer todo: ir directo al archivo de la tabla y, si la pregunta no encaja, empezar por `${CLAUDE_PLUGIN_ROOT}/memory/MEMORY.md`.

| Pregunta | Archivo |
|---|---|
| ¿Qué repo o servicio implementa esto? ¿Quién es el owner? ¿Qué vertical de ClickUp? | `${CLAUDE_PLUGIN_ROOT}/memory/modules.md` (tablas de repos) |
| ¿Qué módulos usan la colección X? ¿Es compartida? | `${CLAUDE_PLUGIN_ROOT}/memory/modules.md` (sección "Colecciones compartidas") |
| ¿Quién emite o consume el evento Y? ¿Qué cambios de contrato están permitidos? | `${CLAUDE_PLUGIN_ROOT}/memory/event-contracts.md` |
| ¿Qué puede romperse? ¿Cómo lo chequeo? | `${CLAUDE_PLUGIN_ROOT}/memory/risks.md` |
| ¿En qué estado de ClickUp va? ¿Cómo nombro el branch? ¿Quién valida? | `${CLAUDE_PLUGIN_ROOT}/memory/workflow.md` |
| ¿Por qué esto falla en staging, en el build o al deployar? | `${CLAUDE_PLUGIN_ROOT}/memory/gotchas.md` |
| ¿Por qué se decidió X? | `${CLAUDE_PLUGIN_ROOT}/memory/decisions/` |

Lo que es propio de un solo repo (decisiones, gotchas locales) está en `.agent/memory/` de ese repo, no acá.

## Cómo responder
- Citar el archivo de origen y la fecha/origen de la línea (`2026-09 · scan repos/`).
- Colecciones y eventos salen de un relevamiento del código, no de una fuente oficial. Si hay que actuar sobre la respuesta (cambiar un esquema, tocar un evento) y los repos están disponibles, confirmarla con una búsqueda en el código o con `/norkut-core:event-contract-check`.
- Un nombre de colección declarado en varios repos no prueba acoplamiento real: aclararlo y sugerir confirmarlo con el owner.
- Si un dato figura `_por definir_` o falta, decirlo tal cual y proponer `/norkut-core:promote-learning` cuando se averigüe. No inventar owners, verticales ni consumidores.

## Reglas
- Ante una colección compartida, avisar siempre antes de modificar su esquema y nombrar a los otros repos que la declaran.
- Ante un evento con consumidores en otros repos, recordar las reglas del contrato de `event-contracts.md` (solo cambios aditivos, propiedades nuevas nullable) antes de proponer cambios.
