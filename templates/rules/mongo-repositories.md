---
paths:
  - "**/*Repository*.cs"
  - "**/Persistence/**/*.cs"
---
# Repositorios y acceso a Mongo
- Toda operación filtra por `TenantId` tomado del contexto de ejecución.
- Antes de modificar el esquema de una colección, verificar en `modules.md` si es compartida y avisar al owner.
- Índices nuevos: declararlos en código, no a mano en la base.
