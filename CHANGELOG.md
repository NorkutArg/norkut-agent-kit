# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado [semver](https://semver.org/lang/es/).

## [Unreleased]

### Agregado
- T0.1: `package.json` del CLI `@norkut/agent-kit`, `bin/cli.js` con los comandos `init`, `sync`, `doctor` y `update` (todavía sin implementar), y `.claude-plugin/marketplace.json` inicial.

### Agregado (CLI)
- CI: `.github/workflows/test.yml` corre `node --test` y `npm pack --dry-run` en Node 20 y 22 en cada PR.
- T0.6: `init --role backend|frontend|pm [--source <repo o ruta>]`. Verifica Claude Code y Cursor, agrega el marketplace `norkut` si falta, instala `norkut-core` y el plugin del rol si ya existe en el marketplace, y lista las env vars faltantes de los MCPs. Idempotente.
- T0.7: `sync`. Desde la raíz de un repo git crea `CLAUDE.md` (si falta) con datos de `modules.md` y los servicios .NET detectados, siembra `.agent/rules/` (si falta), genera `.claude/rules/*.md` y `.cursor/rules/*.mdc`, borra generados huérfanos, copia la memoria a `.agent/shared/`, genera `.cursor/rules/00-norkut-context.mdc`, crea `.agent/memory/MEMORY.md` y completa el `.gitignore`. Idempotente.
- T0.8: `doctor [--no-mcp]`: versión del kit, Claude Code, marketplace, versión instalada vs. pineada de cada plugin, conexión de los MCPs del plugin, env vars faltantes y drift de reglas generadas y `.agent/shared/`; sale con código 1 si hay problemas. `update`: refresca el marketplace, actualiza los plugins Norkut instalados y avisa si no quedan en la versión que pinea el kit.
- T0.9: hooks `secret-guard` (bloquea credenciales), `tenant-guard`, `contract-guard` y `branch-guard` (avisos). Solo actúan en repos con remoto `NorkutArg`. `hooks.json` vuelve a tenerlos.

### Agregado (memoria)
- `scripts/scan-repos.js`: el relevamiento de colecciones y eventos queda versionado y testeado. Detecta eventos C# por contenido y no por nombre de carpeta, que no siempre coincide con el evento: corrige `modules.md` (p. ej. `Module-IntegrationBridge` emite `Integrate*`, no `ExchangeRate`/`Store`/`User`) y `event-contracts.md` (104 eventos; de 26 a 12 sin productor detectado).
- `test/conventions.test.js`: verifica frontmatter y largo de los `SKILL.md`, referencias `/plugin:skill` y `${CLAUDE_PLUGIN_ROOT}/...`, scripts de hooks, fecha y origen de cada línea de memoria, y que no haya credenciales en el kit.
- `event-contracts.md` y `modules.md`: el relevamiento ahora detecta productores y consumidores Python (PyMassTransit: `urn:message:IntegrationEvents.Events:`, `message_name`, `exchange_name`). Suma Module-Integrations, Module-IA, Module-Insights y Module-UMS; 115 eventos en total.
- T0.3: `memory/modules.md` con repos, eventos que emite cada uno y 23 colecciones compartidas; `event-contracts.md` con las reglas del contrato y los eventos con 3 o más repos involucrados; filas nuevas en `risks.md` y evidencia en `gotchas.md`.

### Agregado (skills)
- T2.2: plugin `norkut-pm` con `status-report` (período) y `daily-summary` (un día), a partir de las transcripciones Tactiq en Google Drive. Migra y amplía el skill `norkut-status-report`.
- T1.4: plugins `norkut-backend` (`dotnet-module`, `mongo-collection`) y `norkut-frontend` (`angular-feature`), registrados en el marketplace. Dependen de `norkut-core`.
- `tenant-isolation-check`, `event-contract-check` y `dod-check` en `norkut-core`. Los dos primeros portan `nk-tenant-audit` y `nk-event-contract` del workspace para que funcionen desde un solo repo (fallback a `gh search code`) y suman las formas Python de PyMassTransit. Hooks, `pr-review`, memoria y templates apuntan a ellos en vez de a los skills del workspace.

### Cambiado (skills)
- T0.4: `norkut-context` apunta a los archivos con `${CLAUDE_PLUGIN_ROOT}/memory/`, separa colecciones compartidas de eventos, y pide confirmar en el código antes de actuar sobre datos del relevamiento.

- T0.5: `feature-kickoff`, `pr-review` y `promote-learning` usan rutas `${CLAUDE_PLUGIN_ROOT}/memory/`, las reglas reales de contratos de eventos (solo aditivos, sin versión) y los chequeos de capas, conector e idempotencia de `docs/`; cuidan el límite diario del MCP de ClickUp.
- Template de `CLAUDE.md`, regla `integration-events.md` y README de hooks: "bump de versión" reemplazado por la regla de cambios aditivos.

### Corregido
- `plugin.json` de `norkut-core`: se quitan `skills`, `agents`, `hooks` y `mcpServers`, que apuntaban a las ubicaciones por defecto; `agents` como directorio hacía fallar `claude plugin validate`.

### Cambiado
- `hooks/hooks.json` de `norkut-core` queda vacío hasta T0.9: referenciaba scripts que todavía no existen y rompía cada `Write`/`Edit`/`Bash` al instalar el plugin.
