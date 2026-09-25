# norkut-agent-kit

Harness de IA del equipo Norkut para Claude Code + Cursor.

## Instalar (una vez por máquina)
El CLI se publica en GitHub Packages. Primero, npm tiene que saber dónde buscar `@norkutarg` y cómo autenticarse. En `~/.npmrc`:
```
@norkutarg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
`GITHUB_TOKEN` es un token clásico de GitHub con permiso `read:packages` (el mismo que usa el MCP de GitHub del plugin, que además necesita `repo`). npm lee la variable de entorno: el token no queda escrito en el archivo.

```bash
npx @norkutarg/agent-kit init --role backend|frontend|pm
```
`init` agrega el marketplace de plugins pineado a la versión del kit (`NorkutArg/norkut-agent-kit@v<versión>`) e instala `norkut-core` y el plugin del rol. Exportar las env vars que reporte como faltantes (hoy `CLICKUP_API_TOKEN` y `GITHUB_TOKEN`).

## En cada repo
```bash
npx @norkutarg/agent-kit sync     # genera CLAUDE.md (si falta), rules y contexto compartido
npx @norkutarg/agent-kit doctor   # verifica que todo esté en orden
```

## Actualizar
```bash
npx @norkutarg/agent-kit@latest update   # re-pinea el marketplace a la versión nueva y actualiza los plugins
```

## Skills principales
- `norkut-core` (todos): `/norkut-core:feature-kickoff` · `/norkut-core:pr-review` · `/norkut-core:start-task` · `/norkut-core:dod-check` · `/norkut-core:tenant-isolation-check` · `/norkut-core:event-contract-check` · `/norkut-core:promote-learning` · `norkut-context` (automático)
- `norkut-backend` (`--role backend`): `/norkut-backend:dotnet-module` · `/norkut-backend:mongo-collection`
- `norkut-frontend` (`--role frontend`): `/norkut-frontend:angular-feature`
- `norkut-pm` (`--role pm`): `/norkut-pm:status-report` · `/norkut-pm:daily-summary` (necesitan el conector de Google Drive de claude.ai)

## Publicar una versión
1. Subir `version` en `package.json` (y en `plugins/*/.claude-plugin/plugin.json` de los plugins que cambiaron) y mover `[Unreleased]` de `CHANGELOG.md` a la versión nueva.
2. PR y merge a `main`.
3. Tag y push desde `main`: `git tag v<versión> && git push origin v<versión>`. El workflow `release` verifica que el tag coincida con `package.json`, corre los tests y publica. Ese mismo tag es el que pinea el marketplace.

## Contribuir
Leer `SPEC.md` y `CLAUDE.md`. Cambios por PR; skills y memoria tienen owner. Nunca commitear credenciales.
