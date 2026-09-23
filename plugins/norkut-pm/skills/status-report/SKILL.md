---
name: status-report
description: Generar el reporte de status de Norkut para un período (semana, rango de fechas, mes) a partir de las dailies transcriptas por Tactiq en Google Drive — highlights por vertical, riesgos que requieren atención, decisiones y pendientes. Usar cuando el PM pide "status de la semana", "reporte de highlights", "qué pasó en las dailies del X al Y" o "qué riesgos hay".
---

# Status report por período

Fuente, formato de los archivos y mapeo daily → vertical: `${CLAUDE_PLUGIN_ROOT}/reference/tactiq-dailies.md`. Leerlo antes de empezar.

## Pasos

1. **Período**: si no está explícito, preguntar. "Esta semana" = lunes a hoy; "la semana pasada" = lunes a domingo anteriores. Convertir a `createdTime` en RFC 3339 UTC (la zona del equipo es UTC-3).
2. **Listar** las dailies del período (solo metadatos) y mostrar cuántas hay por vertical y por día. Si faltan días hábiles de alguna vertical, anotarlo.
3. **Leer** cada doc y extraer avances, bloqueos/riesgos, decisiones y pendientes (criterios en la referencia). Para más de ~20 docs, procesar por vertical y resumir cada una antes de pasar a la siguiente.
4. **Clasificar riesgos** con la escala del campo Risk de ClickUp: `Normal` / `Warning` / `Danger`. Danger = bloquea una entrega, afecta a clientes en producción, o toca aislamiento de tenant o un contrato de evento sin plan.
5. **Cruzar entre verticales**: un bloqueo en una que depende de otra (p. ej. POS esperando a Bridge) va arriba de todo.
6. **Entregar** el reporte en el formato de abajo. No publicarlo ni mandarlo a nadie sin que el usuario lo pida.

## Formato

```
# Status Norkut — <desde> a <hasta>

## Lo que hay que mirar
| Riesgo | Vertical | Nivel | Desde | Qué hace falta |
|---|---|---|---|---|

## Por vertical
### <Vertical>
- **Avances:** …
- **Bloqueos:** …
- **Decisiones:** …
- **Pendientes:** … (responsable)
Fuentes: [<fecha>](<viewUrl>) · …

## Cobertura
<N> dailies leídas · días sin daily por vertical · reuniones excluidas
```

## Reglas
- "Lo que hay que mirar" va primero y tiene como máximo 7 filas: si hay más, priorizar Danger y lo que cruza verticales.
- Una vertical sin novedades se reporta en una línea ("sin avances reportados"), no se omite.
- Sin fuente, no hay highlight.
