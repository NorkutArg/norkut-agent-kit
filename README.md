# norkut-agent-kit

Harness de IA del equipo Norkut para Claude Code + Cursor.

## Instalar (una vez por máquina)
```bash
npx @norkut/agent-kit init --role backend|frontend|pm
```
Exportar las env vars que `init` reporte como faltantes (hoy `CLICKUP_API_TOKEN` y `GITHUB_TOKEN`).

## En cada repo
```bash
npx @norkut/agent-kit sync     # genera CLAUDE.md (si falta), rules y contexto compartido
npx @norkut/agent-kit doctor   # verifica que todo esté en orden
```

## Skills principales
- `norkut-core` (todos): `/norkut-core:feature-kickoff` · `/norkut-core:pr-review` · `/norkut-core:dod-check` · `/norkut-core:tenant-isolation-check` · `/norkut-core:event-contract-check` · `/norkut-core:promote-learning` · `norkut-context` (automático)
- `norkut-backend` (`--role backend`): `/norkut-backend:dotnet-module` · `/norkut-backend:mongo-collection`
- `norkut-frontend` (`--role frontend`): `/norkut-frontend:angular-feature`

## Contribuir
Leer `SPEC.md` y `CLAUDE.md`. Cambios por PR; skills y memoria tienen owner. Nunca commitear credenciales.
