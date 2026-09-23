# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# norkut-agent-kit

Kit de herramientas de IA para el equipo Norkut: marketplace de plugins de Claude Code, CLI de bootstrap (`@norkut/agent-kit`) y memoria compartida cross-repo. Este repo se implementa siguiendo `PLAN.md`.

## Antes de tocar nada
- Leer `SPEC.md` completo. Es la fuente de verdad de la arquitectura (§4.3 estructura, §4.4 CLI, §4.5 memoria, §4.6 hooks).
- Trabajar una tarea de `PLAN.md` por vez, en orden. Cada tarea tiene criterio de aceptación: no está hecha hasta que se verifica.
- Verificar el formato actual de `plugin.json`, `marketplace.json` y `hooks.json` en https://code.claude.com/docs/en/plugins-reference (y el I/O de hooks en https://code.claude.com/docs/en/hooks) antes de escribirlos. No confiar en formatos de memoria.

## Estado actual
Fase 0 construida (T0.1–T0.9). Fase 1 en curso. Actualizar esta sección al cerrar tareas.

### Pendiente de prueba (la hace Diego, no bloquea seguir)
- T0.5 / T1.3: `feature-kickoff`, `pr-review` y `promote-learning` end-to-end sobre una tarea de ClickUp y PRs reales. Estados y campos de ClickUp sin verificar contra la API (plan Free: 100 llamadas por día).
- Skills `dod-check`, `event-contract-check` y `tenant-isolation-check`: construidos y cargan (`claude plugin details`), sin correr sobre un cambio real. Portan la lógica de `nk-tenant-audit` y `nk-event-contract` del workspace; fuera del workspace, `event-contract-check` busca con `gh search code --owner NorkutArg`.
- T1.2: revisar con el Arquitecto los borradores de `CLAUDE.md` de `Module-Integrations` y `Front-Core` (12 preguntas `_completar con el Arquitecto_`) y abrir los PRs en esos repos.
- Seguridad (fuera del kit): rotar el token de Azure DevOps de `Module-Integrations/docker-compose.yml` y las claves de su `.env` (commit `88f7837`), el `_password` de `Front-Core/.npmrc` (commit `f20f36b`) y revisar la API key de `Front-Core/public/env.js`. Avisar la query sin tenant de `mercadopago_api/.../order_repository.py:87`.
- Push del kit a una rama + PR (todo el trabajo está solo en local).
- Exportar `CLICKUP_API_TOKEN` y `GITHUB_TOKEN`: sin el primero el MCP `clickup` del plugin falla con 401.

### Pendiente de decisión
- T1.1: registro para publicar el CLI. GitHub Packages exige renombrar a `@norkutarg/agent-kit`; Azure DevOps Artifacts mantiene `@norkut/agent-kit` pero suma un PAT de Azure. Publicar requiere push y tag `v<versión>`; con eso, `init` debería agregar el marketplace pineado (`NorkutArg/norkut-agent-kit@v<versión>`).
- Owners y verticales de `modules.md` (casi todos `_por definir_`); "Terraform" en el resumen de `MEMORY.md` sin evidencia en `repos/`.
- Cursor no lee `CLAUDE.md` (solo `.cursor/rules/` y `AGENTS.md`), contra lo que dice `SPEC.md` §4.1. ¿Generar `AGENTS.md`? Choca con la regla del workspace.

### Falta construir
- T1.4: plugins `norkut-backend` y `norkut-frontend` (y `norkut-pm` en T2.2).

### Cómo probar en local
- CLI: `init` y los tests hablan con Claude Code solo vía `src/claude.js`; los tests reemplazan `claude` por `test-fixtures/fake-claude.js` en el `PATH` (fuera de `test/` porque `node --test` ejecuta todo `.js` bajo `test/`). `node bin/cli.js init --role pm --source ./`.
- `sync`/`doctor`: sobre un clon en el scratchpad (`git clone -q repos/<Repo> <scratchpad>/<Repo>`), nunca sobre `repos/`. `doctor` reutiliza `generatedFiles()` de `src/sync.js`; `update` compara contra `plugins/*/.claude-plugin/plugin.json` (`src/kit.js`).
- Plugin: `claude plugin update` no refresca la copia en `~/.claude/plugins/cache/` sin bump de `version`; usar `uninstall` + `install`. `plugin.json` no declara rutas: se autodescubren `skills/`, `agents/`, `hooks/hooks.json`, `.mcp.json`.
- Hooks (`plugins/norkut-core/hooks/*.mjs`): solo actúan en repos con remoto `NorkutArg`; probar en un repo del scratchpad con `git remote add origin git@github.com:NorkutArg/<x>.git`.
- Memoria: el relevamiento de colecciones y eventos (C# por carpetas `IntegrationEvents/`, Python por `urn:message:`, `message_name`, `exchange_name`) todavía no está versionado en el kit.

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
- Todo lo que el CLI escribe en la máquina del dev es idempotente y no pisa archivos existentes salvo los generados (`.claude/rules/`, `.cursor/rules/`, `.agent/shared/`), que llevan la marca `<!-- generado por norkut-agent-kit — editar .agent/rules/ -->` después del frontmatter (antes lo rompería). `sync` solo borra generados huérfanos que tengan esa marca. `doctor` detecta drift comparando esos generados contra `.agent/rules/`.
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
