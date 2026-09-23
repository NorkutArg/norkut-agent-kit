---
name: mongo-collection
description: Antes de crear, renombrar o cambiar el esquema de una colección de MongoDB en Norkut — averigua qué otros repos y servicios declaran o leen esa colección, quién es el owner del esquema, si está tenant-scoped y qué rompe el cambio. Usar cuando se agrega un campo, índice o colección, se renombra una propiedad de una Entity, o se toca `Collections.cs`.
---

# Cambio en una colección de Mongo

Una colección con el mismo nombre puede estar declarada en varios repos: un cambio de esquema en uno rompe a otro que lee los mismos documentos, y nada lo detecta en CI.

## 1. Identificar la colección y el cambio

- Nombre real: la constante en `*.Infrastructure/Constants/Collections.cs` (`Collections.Stores` → `"stores"`), o el `database["..."]` en Python.
- Tipo de cambio: colección nueva · campo nuevo · campo renombrado/borrado/cambio de tipo · índice · migración de datos.

## 2. Quién más la usa

1. **Memoria compartida**: usar el skill `norkut-core:norkut-context` y preguntar por la colección. La sección "Colecciones compartidas" de `modules.md` lista los repos/servicios que declaran el mismo nombre y el owner del esquema.
2. **Confirmar en el código**, porque la memoria es un relevamiento:
   - Workspace con `repos/` disponible:
     ```bash
     COL=stores
     grep -rn --include='Collections.cs' "\"$COL\"" <ruta a repos/>
     grep -rn --include='*.py' -E "\[['\"]$COL['\"]\]|collection\(['\"]$COL['\"]" <ruta a repos/>
     ```
   - Sin workspace: `gh search code "\"$COL\"" --owner NorkutArg --limit 100 --json repository,path -q '.[] | "\(.repository.nameWithOwner)\t\(.path)"'`.
3. **¿Misma base?** Que dos servicios declaren el mismo nombre no prueba que compartan documentos: cada servicio puede tener su base (p. ej. `Module-Integrations/mercadopago_api` tiene `users` y `stores` propias). Confirmarlo en la connection string / `DatabaseName` de config de cada servicio, o preguntarlo al owner. Si no se puede confirmar, tratarla como compartida.

## 3. Evaluar el cambio

| Cambio | Riesgo |
|---|---|
| Colección nueva | Bajo. Debe tener campo de tenant desde el día uno y constante en `Collections` |
| Campo nuevo opcional | Bajo. Los lectores viejos lo ignoran; no asumir que existe en documentos viejos |
| Campo nuevo obligatorio para la lógica | Medio. Documentos existentes no lo tienen: migración o default |
| Renombrar, borrar o cambiar el tipo de un campo | **Alto** si la colección es compartida: rompe a los otros lectores en runtime |
| Índice nuevo | Medio en colecciones grandes (creación en producción) |
| Colección sin campo de tenant | **Crítico**: no se puede aislar después (ver `/norkut-core:tenant-isolation-check`) |

## 4. Resultado

```
## Colección `<nombre>` — <tipo de cambio>

**Compartida:** sí/no/sin confirmar · **Owner del esquema:** … · **Tenant-scoped:** sí/no

| Repo/servicio | Uso (declara/lee/escribe) | Se rompe con el cambio |
|---|---|---|

**Riesgo:** bajo/medio/alto — <por qué>
**Plan:** migración, orden de despliegue, a quién avisar
```

Si el owner figura `_por definir_`, decirlo y proponer a quién preguntar (Arquitecto). Si el mapa real difiere de `modules.md`, proponer la corrección con `/norkut-core:promote-learning`.
