---
paths:
  - "**/IntegrationEvents/**/*.cs"
  - "**/Events/**/*.cs"
---
# Eventos de integración
- Un cambio de payload es un cambio de contrato: bump de versión y fila en `event-contracts.md` del kit.
- Los consumidores existentes tienen que seguir funcionando o actualizarse en el mismo release.
- Handlers de eventos son idempotentes.
