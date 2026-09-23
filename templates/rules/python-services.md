---
stacks: [python]
paths:
  - "**/*.py"
---
# Servicios Python
- Toda query filtra por tenant y todo pipeline arranca con un `$match` que lo incluye. El tenant sale del header del request, nunca del body. Un `query_filter` nuevo recibe `subscription_id` como parámetro obligatorio.
- Nombres de colección y de campo: los del servicio .NET dueño del dominio (su `Entity`), no inventados.
- Eventos (PyMassTransit): el contrato es `IntegrationEvents.Events:<Evento>` y el schema Pydantic del consumer es otra copia del record de C#. Solo cambios aditivos.
- Interfaces `ABC` con prefijo `I` en `domain/`, implementación `singleton` en `injectors/`, constructores con `@inject`.
