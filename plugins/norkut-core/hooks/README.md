# Hooks

`PreToolUse`, configurados en `hooks.json`. Cada script lee el JSON del tool call por stdin (`tool_input.file_path`, `content`, `new_string`, `edits[]`, `command`). Esquema de I/O: https://code.claude.com/docs/en/hooks.

- Son `.mjs` porque corren desde la copia del plugin en `~/.claude/plugins/cache/`, donde no hay `package.json` con `"type": "module"`.
- Solo actúan en repos cuyo remoto es de `NorkutArg` (`lib.mjs` → `isNorkutRepo`): el plugin se instala a scope usuario y corre en todos los proyectos del dev.
- Bloquear: exit 2 + `permissionDecision: "deny"`. Avisar: exit 0 + `systemMessage` (lo ve el dev) y `additionalContext` (lo ve Claude).

| Script | Modo | Regla |
|---|---|---|
| `secret-guard.mjs` | bloquea | `Write`/`Edit` cuyo texto nuevo tenga `mongodb(+srv)://usuario:clave@`, `ghp_…`/`github_pat_…`, `AKIA…`, o `Password=` literal en una connection string (se permiten placeholders `${…}`) |
| `tenant-guard.mjs` | aviso | Archivo `*Repository*.cs`, `*Handler*.cs` o `*Dao*.cs` cuyo texto nuevo arma una query (`MongoDbQueryBuilder`, `.InCollection(`, `Find(`, `Filter.`) sin `.WithTenant(`, `.NonTenant(`, `TenantId` ni `SubscriptionId` |
| `contract-guard.mjs` | aviso | Archivo `.cs` bajo `IntegrationEvents/` → recordar que solo se permiten cambios aditivos y listar productores y consumidores |
| `branch-guard.mjs` | aviso | Branch creado (`git checkout -b`, `git switch -c`, `git branch`) o pusheado que no sigue `[<tipo>/]CU-<id>_<descripcion>_<Nombre-Apellido>` (salvo `main`/`master`/`develop` y `memory/*`); sugiere el nombre con `git config user.name`. En `git commit`, un `CU-<id>[<estado>]` con un estado que no existe en ClickUp o con espacio antes del corchete |
