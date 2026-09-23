# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado [semver](https://semver.org/lang/es/).

## [Unreleased]

### Agregado
- T0.1: `package.json` del CLI `@norkut/agent-kit`, `bin/cli.js` con los comandos `init`, `sync`, `doctor` y `update` (todavía sin implementar), y `.claude-plugin/marketplace.json` inicial.

### Agregado (memoria)
- T0.3: `memory/modules.md` con repos, eventos que emite cada uno y 23 colecciones compartidas; `event-contracts.md` con las reglas del contrato y los eventos con 3 o más repos involucrados; filas nuevas en `risks.md` y evidencia en `gotchas.md`.

### Cambiado (skills)
- T0.4: `norkut-context` apunta a los archivos con `${CLAUDE_PLUGIN_ROOT}/memory/`, separa colecciones compartidas de eventos, y pide confirmar en el código antes de actuar sobre datos del relevamiento.

### Corregido
- `plugin.json` de `norkut-core`: se quitan `skills`, `agents`, `hooks` y `mcpServers`, que apuntaban a las ubicaciones por defecto; `agents` como directorio hacía fallar `claude plugin validate`.

### Cambiado
- `hooks/hooks.json` de `norkut-core` queda vacío hasta T0.9: referenciaba scripts que todavía no existen y rompía cada `Write`/`Edit`/`Bash` al instalar el plugin.
