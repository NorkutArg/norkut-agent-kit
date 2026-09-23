# Contratos de eventos de integración

> Un bloque por evento. Cambiar un contrato = bump de versión + fila nueva + actualizar consumidores o garantizar compatibilidad. `contract-guard` revisa estos globs: _definir rutas reales_, p. ej. `**/IntegrationEvents/**/*.cs`.

## Convenciones
- 2026-09 · onboarding · Versionado de eventos: _política por definir con el Arquitecto_ (está en la lista de gaps de onboarding junto con API versioning y contract testing).

## Eventos
### <NombreEvento> vN
- Emite: <módulo> · Consume: <módulos>
- Payload: …
- Desde: YYYY-MM · Origen: PR #
- Compatibilidad: …
