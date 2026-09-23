---
stacks: [dotnet]
paths:
  - "**/IntegrationEvents/**/*.cs"
  - "**/Events/**/*.cs"
---
# Eventos de integración
- El contrato es `namespace IntegrationEvents.Events` + nombre del `record`, y cada repo tiene su copia. Solo cambios aditivos: propiedades nuevas nullable y sin `required`; no renombrar tipo, namespace ni `EndpointName`.
- Antes de tocar un evento, listar productores y consumidores en todos los repos (`/norkut-core:event-contract-check`, o `event-contracts.md` del kit) y actualizar las copias que lo necesiten.
- Handlers de eventos son idempotentes.
