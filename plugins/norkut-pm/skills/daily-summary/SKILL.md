---
name: daily-summary
description: Resumen ejecutivo de las dailies de Norkut de un día (todas las verticales) a partir de las transcripciones Tactiq en Google Drive — en pocas líneas, qué avanzó, qué está bloqueado y qué necesita una acción hoy. Usar cuando el PM pide "resumen de las dailies de hoy/ayer", "qué pasó en la daily de POS" o un resumen para mandar al equipo.
---

# Resumen de dailies de un día

Fuente, formato y mapeo daily → vertical: `${CLAUDE_PLUGIN_ROOT}/reference/tactiq-dailies.md`.

## Pasos

1. **Día**: hoy salvo que se indique otro. Si piden una sola vertical, filtrar por título.
2. **Listar** las dailies de ese día (`createdTime` dentro del día, UTC-3) y leerlas.
3. **Resumir** por vertical en 2-4 líneas: avance principal, bloqueo si lo hay, acción pendiente con responsable. Aplicar los criterios de la referencia.
4. **Acciones de hoy**: juntar al final lo que necesita una decisión o un seguimiento del PM ese mismo día.

## Formato

```
# Dailies <fecha>

**<Vertical>** — <avance>. <bloqueo o "sin bloqueos">. <pendiente (responsable)>. [doc](<viewUrl>)
…

**Para hoy:**
- …

<N> dailies · faltan: <verticales sin daily>
```

## Reglas
- Máximo ~15 líneas en total: es para leer en un minuto. Para un período más largo, usar `/norkut-pm:status-report`.
- Si una daily se canceló o solo trató otro tema (p. ej. un incidente), decirlo en su línea.
- No mandar el resumen a nadie sin pedido explícito del usuario.
