# Plan de implementación — para ejecutar con Claude Code

Cada tarea tiene criterio de aceptación. Trabajar en orden; una tarea por sesión o por commit. Leer `SPEC.md` antes de empezar cualquier fase.

## Fase 0 — Esqueleto del kit

### T0.1 Estructura del repo
- Crear la estructura de `SPEC.md` §4.3.
- `package.json` con `name: @norkut/agent-kit`, `bin: { "norkut-agent-kit": "bin/cli.js" }`, `type: module`, Node ≥ 20.
- **Acepta**: `npm pack` genera el tarball sin errores; `node bin/cli.js --help` lista `init|sync|doctor|update`.

### T0.2 Marketplace y plugin `norkut-core`
- Completar `.claude-plugin/marketplace.json` y `plugins/norkut-core/.claude-plugin/plugin.json` (base en este repo).
- Validar con `claude plugin validate .` (o el comando equivalente en la versión instalada; verificar en https://code.claude.com/docs/en/plugins-reference).
- **Acepta**: `claude plugin marketplace add ./` + `claude plugin install norkut-core@norkut` funciona en local y `/norkut-core:pr-review` aparece en la sesión.

### T0.3 Memoria cross-repo inicial
- Poblar `plugins/norkut-core/memory/` con: `modules.md` (desde el mapa de ownership existente), `risks.md` (desde los 6 riesgos de onboarding), `workflow.md` (estados ClickUp + branch naming), `gotchas.md`, `event-contracts.md` (esqueleto con los eventos conocidos).
- **Acepta**: `MEMORY.md` < 150 líneas y cada archivo tiene ≥ 1 entrada con fecha y origen.

### T0.4 Skill `norkut-context`
- `SKILL.md` que describe cada archivo de `memory/` y cuándo leerlo.
- **Acepta**: preguntar "¿qué módulos tocan la colección X?" en una sesión limpia hace que Claude lea `modules.md` y responda desde ahí.

### T0.5 Skills `feature-kickoff`, `pr-review`, `promote-learning`
- Partir de los `SKILL.md` de este repo. Ajustar a los nombres reales de estados y campos de ClickUp.
- **Acepta**: cada skill corre end-to-end sobre una tarea/PR real de un repo `NorkutArg`.

### T0.6 CLI `init`
- Detectar Claude Code (`claude --version`) y Cursor.
- Agregar marketplace, instalar `norkut-core` + plugin por rol (flag `--role backend|frontend|pm`).
- ~~Mergear `.mcp.json` en `~/.claude/.mcp.json`~~: descartado (2026-09). Claude Code no lee ese archivo (los MCP de usuario viven en `~/.claude.json`) y el plugin `norkut-core` ya entrega sus MCPs.
- ~~Crear `~/.claude/CLAUDE.md` con import al README del kit~~: descartado (2026-09). Cargaría instrucciones de instalación en todas las sesiones; el contexto llega por `norkut-context` y el `CLAUDE.md` de cada repo.
- Listar env vars faltantes: las que referencia como `${VAR}` el `.mcp.json` de `norkut-core` (hoy `CLICKUP_API_TOKEN`, `GITHUB_TOKEN`; `MONGO_RO_URI` cuando entre el MCP de Mongo, ver `SPEC.md` §9).
- **Acepta**: corrida idempotente (segunda ejecución no cambia nada); en máquina limpia termina en < 5 min.

### T0.7 CLI `sync`
- Desde la raíz de un repo: crear `CLAUDE.md` desde `templates/CLAUDE.md.template` reemplazando `{{REPO}}`, `{{MODULES}}`; **nunca** sobrescribir si existe.
- Crear `.agent/rules/` con las reglas base si no existe; generar `.claude/rules/*.md` y `.cursor/rules/*.mdc` desde `.agent/rules/*.md` (frontmatter `paths:` → `globs:` en Cursor).
- Copiar `memory/` del plugin a `.agent/shared/` y generar `.cursor/rules/00-norkut-context.mdc`.
- Crear `.agent/memory/MEMORY.md` desde template si falta.
- Agregar `templates/gitignore.snippet` al `.gitignore` si no está.
- **Acepta**: `git status` después de `sync` en un repo ya sincronizado está limpio (salvo cambios reales en `.agent/rules/`).

### T0.8 CLI `doctor` y `update`
- **Acepta**: `doctor` reporta drift si se edita un `.claude/rules/*.md` a mano; `update` sube de versión y `doctor` lo refleja.

### T0.9 Hooks
- Implementar `secret-guard` (bloqueante) y `branch-guard`, `tenant-guard` (aviso) según `hooks/hooks.json`.
- **Acepta**: escribir un archivo con `mongodb+srv://user:pass@` es bloqueado; `git checkout -b feature/sin-id` dispara el aviso.

## Fase 1 — Piloto

### T1.1 Publicar el CLI en el feed elegido (`SPEC.md` §9).
### T1.2 `sync` en `Module-Integrations` y `Front-Core`; completar sus `CLAUDE.md` con el Arquitecto.
### T1.3 Tres PRs reales revisados con `pr-review`; registrar falsos positivos en `memory/gotchas.md`.
### T1.4 Plugins `norkut-backend` y `norkut-frontend` con al menos un skill cada uno, escritos con sus owners.

## Fase 2 — Equipo completo

### T2.1 `init` en todas las máquinas; `sync` en todos los repos `NorkutArg`.
### T2.2 Migrar `norkut-status-report` al plugin `norkut-pm`.
### T2.3 Primer ciclo de `promote-learning`: cada dev promueve ≥ 1 aprendizaje.

## Fase 3 — Endurecer

### T3.1 `contract-guard` y `tenant-guard` pasan a bloqueantes tras acuerdo en retro.
### T3.2 Revisión trimestral de skills y memoria.
