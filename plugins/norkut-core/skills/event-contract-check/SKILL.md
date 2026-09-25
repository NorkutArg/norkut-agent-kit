---
name: event-contract-check
description: Analiza el impacto de cambiar un evento de integración de Norkut — lista qué repos lo producen y consumen (C#, Python, Lambdas), compara las copias del contrato y clasifica el cambio como aditivo o rompiente. Usar SIEMPRE antes de editar un archivo bajo IntegrationEvents/, un record de `namespace IntegrationEvents.Events`, o un consumer/publisher Python de PyMassTransit, y cuando lo sugiere el hook contract-guard.
---

# Chequeo de contrato de evento

Cada repo tiene su **propia copia** del contrato y MassTransit matchea por `namespace IntegrationEvents.Events` + nombre del tipo. Renombrar una propiedad en un repo compila, pasa CI y rompe en runtime a los demás. Reglas y mapa relevado: `${CLAUDE_PLUGIN_ROOT}/memory/event-contracts.md`.

## 1. Identificar el evento

Del diff, del archivo abierto o del pedido. `EV` = nombre del tipo (p. ej. `InvoiceEmitted`).

```bash
DEF=$(git symbolic-ref --short refs/remotes/origin/HEAD)
git diff "$DEF"...HEAD --name-only | grep -E 'IntegrationEvents/|/consumers/|/publishers/'
```

## 2. Mapa de impacto

Primero, la fila del evento en `event-contracts.md` (quién emite, quién consume). Es un relevamiento: confirmarlo con una búsqueda, en este orden según lo que esté disponible.

**a) Workspace con los 58 repos** (`repos/` en un directorio padre): búsqueda local, todos los lenguajes.

```bash
EV=InvoiceEmitted
SNAKE=$(echo "$EV" | sed -E 's/([a-z0-9])([A-Z])/\1_\2/g' | tr 'A-Z' 'a-z')
R=<ruta a repos/>
grep -rl -E "\b($EV|$SNAKE)\b" "$R" | grep -v '/\.git/' | sed "s|^$R/||" | cut -d/ -f1 | sort | uniq -c | sort -rn
find "$R" -name "$EV.cs" -not -path '*/.git/*'                                             # copias del record
grep -rln --include='*.cs' -E "(IConsumer|ContextConsumer|ContextBatchConsumer)<(Batch<)?$EV>" "$R"
grep -rn  --include='*.cs' -A5 -E "ConsumerDefinition<${EV}[A-Za-z]*Consumer>" "$R" | grep EndpointName
grep -rln --include='*.cs' -E "(class|interface) I?${EV}Producer" "$R"
grep -rn  --include='*.py' -E "urn:message:IntegrationEvents\.Events:$EV\b|message_name\s*=\s*['\"]$EV['\"]|IntegrationEvents\.Events:$EV\b|entity_event\s*=\s*['\"]$EV['\"]" "$R"
```

**b) Sin workspace**: búsqueda de código en GitHub sobre la org.

```bash
gh search code "$EV" --owner NorkutArg --limit 100 --json repository,path -q '.[] | "\(.repository.nameWithOwner)\t\(.path)"'
```

Alternativa: el MCP de GitHub (`search_code` con `org:NorkutArg $EV`). El índice de GitHub puede no incluir branches ni forks: decir que es una búsqueda parcial.

Formas a no perder:
- C#: consumers `IConsumer<T>`, `ContextConsumer<T>` y `ContextBatchConsumer<T>`, y batcheados `IConsumer<Batch<T>>`. La carpeta `IntegrationEvents/` vive en `*.Domain`, `*.Application` o `*.Actions`.
- Python (PyMassTransit): productores con `urn:message:IntegrationEvents.Events:<EV>`; consumidores con `message_name = "<EV>"` o `exchange_name = "IntegrationEvents.Events:<EV>"`. El payload se valida con un schema Pydantic propio: es **otra copia** del contrato.
- Lambdas: `send_event_message(entity_event='<EV>')` en `CloudFunctions`.

Si no aparece productor en C#, **no concluir** que no se publica: varios eventos salen de Python o de Lambdas.

## 3. Comparar las copias

```bash
for f in $(find "$R" -name "$EV.cs" -not -path '*/.git/*'); do echo "── $f"; cat "$f"; done
```

Sin workspace, leer cada copia con `gh api repos/NorkutArg/<repo>/contents/<ruta> -q .content | base64 -d`. Incluir los schemas Pydantic de los consumidores Python. Reportar si las copias **ya estaban desalineadas** antes del cambio: es un riesgo latente.

## 4. Clasificar el cambio

| Cambio | Veredicto |
|---|---|
| Agregar propiedad nullable y sin `required` | ✅ Aditivo |
| Agregar propiedad `required` o no nullable | ❌ Rompe a todo productor que todavía no la manda |
| Renombrar, borrar o cambiar el tipo de una propiedad | ❌ Rompe en silencio a los consumidores (C# y schemas Pydantic) |
| Renombrar el tipo o cambiar el namespace | ❌ Cambia el contrato de cable |
| Cambiar `EndpointName` o `queue_name` | ❌ Crea una cola nueva y abandona los mensajes de la vieja |
| Agregar un consumer nuevo | ✅ Seguro, si es idempotente |

## 5. Reporte

1. **Tabla de impacto**: repo → lenguaje → rol (define / produce / consume) → archivos. Aclarar si salió de la búsqueda local, de GitHub o solo de la memoria.
2. **Veredicto**: aditivo o rompiente, de entrada y sin suavizarlo.
3. **Plan de propagación** si es aditivo pero cruza repos: qué copia actualizar en cada repo, orden de despliegue (consumidores antes que productores cuando se agrega un campo que se va a leer) y un PR por repo, con el mismo nombre de branch.
4. **Idempotencia**: si toca un consumer, verificar que reprocesar el mismo mensaje no duplique datos.
5. **Memoria**: si el mapa real difiere de `event-contracts.md`, proponer la corrección con `/norkut-core:promote-learning`.

Si el evento vive en un solo repo, decirlo en una línea: es el caso fácil.
