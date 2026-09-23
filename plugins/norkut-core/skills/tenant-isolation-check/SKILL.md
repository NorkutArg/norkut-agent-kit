---
name: tenant-isolation-check
description: Audita el diff del repo actual buscando fugas multi-tenant de Norkut — queries .NET sin `.WithTenant(...)` o con un `.NonTenant()` injustificado, tenant tomado del request, y queries o pipelines Python sin filtro por tenant. Usar antes de abrir un PR que toque persistencia (DAOs, repositorios, handlers, pipelines), cuando lo sugiere el hook tenant-guard, o cuando piden "revisá el tenant".
---

# Auditoría de aislamiento multi-tenant

Una query sin scope de tenant devuelve datos de **otros clientes**: es un incidente de seguridad, no un bug. Ni el compilador ni el linter lo detectan. Contexto del riesgo: `${CLAUDE_PLUGIN_ROOT}/memory/risks.md`.

## 1. Delimitar el cambio

Por defecto: cambios sin commitear + commits del branch actual contra el branch por defecto real (no asumir `main`). Si el usuario nombra un servicio o una ruta, auditar eso completo.

```bash
DEF=$(git symbolic-ref --short refs/remotes/origin/HEAD)
git status --short
git diff "$DEF"...HEAD --stat
git diff "$DEF"...HEAD -- '*.cs' '*.py'
```

Identificar **qué servicio** se tocó: un repo agrupa varios (la ruta `Inventory/Inventory.Infrastructure/...` es el servicio `Inventory`).

## 2. .NET

```bash
FILES=$(git diff "$DEF"...HEAD --name-only -- '*.cs')
grep -n "MongoDbQueryBuilder\|InCollection(" $FILES
grep -n "WithTenant(\|NonTenant()" $FILES
```

Regla: **cada `new MongoDbQueryBuilder()` encadena `.WithTenant(...)` o `.NonTenant()`.** Patrón correcto: DAO que hereda de `TenantDao<TEntity>`, tenant desde `IContextService.SubscriptionId`, colección desde `Collections.X`.

Hallazgos:
- `MongoDbQueryBuilder` sin ninguno de los dos → **crítico**.
- `.WithTenant(...)` alimentado por un valor del body o de un query param en vez del contexto → **crítico** (el cliente elige qué tenant leer). Rastrear el parámetro hasta el controller.
- `.NonTenant()` **nuevo** → es el juicio central del skill. Es legítimo y frecuente sobre **catálogos y metadata globales** (`Plans`, `PaymentMethods`, `BillingCycles`, `Banks`, `Currencies`, `DocumentTypes`, `Features`, `TaxItems`, roles y acciones de `Module-SSM`). La pregunta: ¿la colección guarda datos de **un cliente concreto** o es referencia compartida?
  - Catálogo global → correcto, no marcarlo.
  - Datos transaccionales o de cliente (`Invoices`, `Products`, `Customers`, `Stores`, `Receptions`, movimientos, órdenes) → **crítico**.
  - Si la colección se consulta **de las dos formas** en el repo, pedir la justificación en el PR:
    ```bash
    COL=Subscription
    echo "NonTenant: $(grep -rn --include='*.cs' -B3 'NonTenant()' . | grep -c "Collections.$COL")"
    echo "WithTenant: $(grep -rn --include='*.cs' -B3 'WithTenant(' . | grep -c "Collections.$COL")"
    ```
    Si el workspace con los 58 repos está disponible (`repos/` en un directorio padre), repetir la cuenta ahí para ver cómo la trata el resto del stack.
- DAO nuevo que no hereda de `TenantDao<TEntity>` cuando los vecinos sí → sospechoso.
- `CreatedBy` / `UpdatedBy` seteados con algo que no sale del contexto → alto.
- `IMongoCollection` o driver de Mongo directo → alto (saltea el conector y su scoping).

## 3. Python

```bash
FILES=$(git diff "$DEF"...HEAD --name-only -- '*.py')
grep -n '"\$match"\|aggregate(\|\.find(\|\.find_one(\|update_one(\|delete_many(' $FILES
```

Regla: **toda query filtra por tenant, y todo pipeline arranca con un `$match` que lo incluye.** El nombre del campo varía según el servicio (`TenantId`, `tenant_id`, `subscription_id`): usar el que ya tiene la colección, no inventar uno.

Hallazgos:
- Pipeline cuyo primer stage no es `$match`, o cuyo `$match` no incluye el tenant → **crítico**.
- `find()` / `find_one()` / `update_*` / `delete_*` por `_id` u otra clave sin tenant, en un endpoint que responde a un cliente → **crítico**. Caso real conocido: `Module-Integrations/mercadopago_api/.../order_repository.py`, que busca órdenes por `PosId` + `_id`.
- Helper que arma condiciones sin recibir el tenant: verificar que el llamador lo agregue.
- Tenant tomado del body en vez del header o del token.
- Colección nueva **sin campo de tenant** → alto: no se puede filtrar después.
- Jobs o schedulers que leen de todos los tenants a propósito → aceptable si está explícito y no expone datos a un cliente; mencionarlo.

## 4. Reporte

Por hallazgo: `archivo:línea`, qué query es, por qué es fuga y el fix concreto siguiendo el patrón del vecino. Ordenar por severidad. Si no hay hallazgos, decirlo en una línea: este skill es solo sobre tenancy, no agregar findings de estilo.

Cerrar con cuántas queries nuevas o modificadas se revisaron, para que se vea el alcance real.
