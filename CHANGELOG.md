# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado [semver](https://semver.org/lang/es/).

## [Unreleased]

### Agregado
- T0.1: `package.json` del CLI `@norkut/agent-kit`, `bin/cli.js` con los comandos `init`, `sync`, `doctor` y `update` (todavía sin implementar), y `.claude-plugin/marketplace.json` inicial.

### Agregado (CLI)
- T0.6: `init --role backend|frontend|pm [--source <repo o ruta>]`. Verifica Claude Code y Cursor, agrega el marketplace `norkut` si falta, instala `norkut-core` y el plugin del rol si ya existe en el marketplace, y lista las env vars faltantes de los MCPs. Idempotente.

### Agregado (memoria)
- T0.3: `memory/modules.md` con repos, eventos que emite cada uno y 23 colecciones compartidas; `event-contracts.md` con las reglas del contrato y los eventos con 3 o más repos involucrados; filas nuevas en `risks.md` y evidencia en `gotchas.md`.

### Cambiado (skills)
- T0.4: `norkut-context` apunta a los archivos con `${CLAUDE_PLUGIN_ROOT}/memory/`, separa colecciones compartidas de eventos, y pide confirmar en el código antes de actuar sobre datos del relevamiento.

- T0.5: `feature-kickoff`, `pr-review` y `promote-learning` usan rutas `${CLAUDE_PLUGIN_ROOT}/memory/`, las reglas reales de contratos de eventos (solo aditivos, sin versión) y los chequeos de capas, conector e idempotencia de `docs/`; cuidan el límite diario del MCP de ClickUp.
- Template de `CLAUDE.md`, regla `integration-events.md` y README de hooks: "bump de versión" reemplazado por la regla de cambios aditivos.

### Corregido
- `plugin.json` de `norkut-core`: se quitan `skills`, `agents`, `hooks` y `mcpServers`, que apuntaban a las ubicaciones por defecto; `agents` como directorio hacía fallar `claude plugin validate`.

### Cambiado
- `hooks/hooks.json` de `norkut-core` queda vacío hasta T0.9: referenciaba scripts que todavía no existen y rompía cada `Write`/`Edit`/`Bash` al instalar el plugin.
