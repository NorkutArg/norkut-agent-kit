# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# norkut-agent-kit

Kit de herramientas de IA para el equipo Norkut: marketplace de plugins de Claude Code, CLI de bootstrap (`@norkut/agent-kit`) y memoria compartida cross-repo. Este repo se implementa siguiendo `PLAN.md`.

## Antes de tocar nada
- Leer `SPEC.md` completo. Es la fuente de verdad de la arquitectura (§4.3 estructura, §4.4 CLI, §4.5 memoria, §4.6 hooks).
- Trabajar una tarea de `PLAN.md` por vez, en orden. Cada tarea tiene criterio de aceptación: no está hecha hasta que se verifica.
- Verificar el formato actual de `plugin.json`, `marketplace.json` y `hooks.json` en https://code.claude.com/docs/en/plugins-reference (y el I/O de hooks en https://code.claude.com/docs/en/hooks) antes de escribirlos. No confiar en formatos de memoria.

## Estado actual (Fase 0 en curso)
T0.1 hecha: `bin/cli.js` expone `init|sync|doctor|update`; `sync`, `doctor` y `update` todavía son stubs que salen con código 1. Faltan, entre otros:
- T0.2 hecha. T0.3 hecha: `memory/` poblada desde `docs/` y `repos/OnBoarding/` del workspace y un scan de `repos/` (colecciones en `*/Constants/Collections.cs`, eventos en `IntegrationEvents/Producers|Consumers/`). Owners y verticales siguen `_por definir_`.
- T0.4 hecha: en una sesión limpia `claude -p "¿Qué módulos de Norkut tocan la colección stores?"` invoca `norkut-context` y responde desde `modules.md`.
- T0.5 a medias: los `SKILL.md` de `feature-kickoff`, `pr-review` y `promote-learning` están ajustados a la memoria y a las convenciones de `docs/`; la prueba end-to-end sobre una tarea y un PR reales queda para el final de la Fase 0. Estados y campos de ClickUp sin verificar contra la API (límite diario del plan Free).
- T0.6 hecha: `init` (`src/init.js`) solo habla con Claude Code a través de `src/claude.js`; los tests reemplazan `claude` por `test-fixtures/fake-claude.js` en el `PATH` (queda fuera de `test/` porque `node --test` ejecuta todo `.js` bajo `test/`). Probar en local con `node bin/cli.js init --role pm --source ./`.
- Probar cambios del plugin en local: `claude plugin update` no refresca la copia en `~/.claude/plugins/cache/` sin bump de `version` en `plugin.json`; usar `claude plugin uninstall` + `install`. Con el marketplace local, `${CLAUDE_PLUGIN_ROOT}` resolvió a este repo, no al caché. `plugin.json` no declara rutas de componentes: se usan las ubicaciones por defecto (`skills/`, `agents/`, `hooks/hooks.json`, `.mcp.json`), que se autodescubren.
- T0.9: `hooks.json` está vacío a propósito para poder instalar el plugin sin hooks rotos. Al implementar los scripts, restaurar la config original con `git show da697ea:plugins/norkut-core/hooks/hooks.json`.
- Skills `dod-check`, `event-contract-check`, `tenant-isolation-check` (referenciadas en README, templates y hooks) y los plugins `norkut-backend`/`frontend`/`pm`.

Actualizar esta sección al cerrar tareas.

## Arquitectura en una foto
Hay dos mundos: **este repo (el kit)** y **los repos destino** de `NorkutArg` donde corre el CLI. No confundirlos.

| En el kit | Termina en el repo destino / máquina del dev como |
|---|---|
| `plugins/norkut-core/` (skills, agents, hooks, `.mcp.json`, `memory/`) | Plugin instalado a scope **usuario** vía `init` (no scope proyecto: tuvo bugs) |
| `plugins/norkut-core/memory/` | Leída en runtime por el skill `norkut-context` vía `${CLAUDE_PLUGIN_ROOT}/memory/`; para Cursor, `sync` la copia a `.agent/shared/` (gitignored) y resume en `.cursor/rules/00-norkut-context.mdc` |
| `templates/CLAUDE.md.template` | `CLAUDE.md` del repo destino, con `{{REPO}}`, `{{MODULES}}`, etc. Se crea solo si no existe; nunca se pisa |
| `templates/rules/*.md` (frontmatter `paths:`) | `.agent/rules/` (fuente canónica, commiteada) → generados `.claude/rules/*.md` y `.cursor/rules/*.mdc` (`paths:` → `globs:`) |
| `templates/agent-memory/MEMORY.md` | `.agent/memory/MEMORY.md` del repo destino |
| `templates/gitignore.snippet` | Se agrega al `.gitignore` del destino si falta |
| `plugins/norkut-core/.mcp.json` | Mergeado por nombre de server en `~/.claude/.mcp.json` sin pisar entradas existentes |

Hooks (`hooks/hooks.json`, detalle en `hooks/README.md`): `secret-guard` bloquea desde el día uno; `tenant-guard`, `contract-guard` y `branch-guard` arrancan en modo aviso.

## Stack
- Node ≥ 20, ESM, sin framework de CLI pesado (`commander` está bien). Sin TypeScript en el CLI para mantenerlo simple.
- Tests con `node --test`. Todo comando del CLI tiene un test de idempotencia.

## Convenciones
- Todo lo que el CLI escribe en la máquina del dev es idempotente y no pisa archivos existentes salvo los generados (`.claude/rules/`, `.cursor/rules/`, `.agent/shared/`), que llevan header `# generado por norkut-agent-kit — editar .agent/rules/`. `doctor` detecta drift comparando esos generados contra `.agent/rules/`.
- Nunca escribir credenciales. Solo nombres de env vars (`CLICKUP_API_TOKEN`, `GITHUB_TOKEN`, `MONGO_RO_URI`); `.mcp.json` usa `${VAR}`.
- Skills: `SKILL.md` < 300 líneas, en español, con frontmatter `name` y `description`. Si necesitan datos de Norkut, referencian `memory/`, no lo duplican.
- Memoria (`plugins/norkut-core/memory/`): solo hechos y decisiones, cada línea con fecha y origen (`2026-09 · PR #123`). `MEMORY.md` < 150 líneas; lo que crece va a su propio archivo.
- Commits en español, imperativo, con el ID de tarea de `PLAN.md` (`T0.6: implementar init`).

## Comandos
```bash
npm install
node bin/cli.js --help                    # init | sync | doctor | update
node --test                               # todos los tests
node --test <ruta/al/archivo.test.js>     # un solo archivo
node --test --test-name-pattern="idempot" # tests por nombre
npm pack                                  # criterio de aceptación de T0.1
claude plugin validate .                  # verificar el comando vigente en la doc
claude plugin marketplace add ./          # probar el marketplace en local
claude plugin install norkut-core@norkut
```
