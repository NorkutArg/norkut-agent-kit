# Hooks

Cada script lee el JSON del tool call por stdin. Verificar el esquema de I/O vigente en https://code.claude.com/docs/en/hooks antes de implementar (exit codes, `hookSpecificOutput`, `permissionDecision`).

| Script | Modo inicial | Regla |
|---|---|---|
| `secret-guard.js` | bloquea | Contenido que matchee `mongodb(\+srv)?://[^:]+:[^@]+@`, `ghp_[A-Za-z0-9]{36}`, `AKIA[0-9A-Z]{16}`, `Password=` dentro de connection strings |
| `tenant-guard.js` | aviso | Archivo matchea `**/*Repository*.cs` o `**/*Handler*.cs` y el contenido tiene `Find(`/`Filter.` sin `TenantId` cerca → sugerir `/norkut-core:tenant-isolation-check` |
| `contract-guard.js` | aviso | Archivo en rutas de eventos de integración (globs reales en `memory/event-contracts.md`) → recordar que solo se permiten cambios aditivos y actualizar `event-contracts.md` si cambian productores o consumidores |
| `branch-guard.js` | aviso | Comando contiene `git checkout -b` o `git push` y el branch no contiene `CU-[a-z0-9]+` → recordar el ID de ClickUp para que la integración GitHub–ClickUp linkee solo |
