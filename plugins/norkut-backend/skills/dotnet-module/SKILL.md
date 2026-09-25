---
name: dotnet-module
description: Crear o extender un caso de uso en un servicio .NET de Norkut (Module-* en C#, JobScheduler) siguiendo el estilo real del servicio — command/query con MediatR y Minimal APIs en los servicios nuevos, o domain service + controller en los legados — con DAO tenant-scoped, mapeo por IMapper, evento de integración y tests. Usar cuando piden "agregá un endpoint", "creá un handler/command/query/DAO", "nuevo caso de uso" en un repo Module-*.
---

# Caso de uso en un servicio .NET

## 1. Ubicar el servicio y su estilo

Un repo `Module-*` agrupa **varios servicios** (`Module-POS` tiene 6). La ruta dice cuál: `Inventory/Inventory.Domain/...` es `Inventory`.

```bash
ls                                                     # servicios del repo
ls <Servicio>                                          # capas: .API .Application .Domain .Infrastructure .Tests
grep -l -i mediatr <Servicio>/*/*.csproj               # ¿usa MediatR?
grep -h -o 'Include="[^"]*MongoDbConnector[^"]*"' <Servicio>/*/*.csproj   # ¿BackAegis o legacy?
git log --oneline -10 -- <Servicio>/                   # qué se tocó último
```

- **Con MediatR y `*.Application/Commands/`** → estilo actual (sección 2).
- **Sin MediatR** → estilo legado: `IXService` en `*.Domain`, controller en `*.API`. Seguir el legado; **no migrar** el servicio de estilo en un PR de feature.
- **Imitar al vecino**: abrir un command/DAO reciente del mismo servicio antes de escribir. Si el vecino hace algo distinto a este skill, gana el vecino (y avisarlo).

## 2. Estilo actual: command / query

```
API  ->  Application (Commands / Queries)  ->  Domain  <-  Infrastructure
```

| Pieza | Dónde | Forma |
|---|---|---|
| Command (escritura) | `*.Application/Commands/<Recurso>/` | `record XCommand(...) : IRequest<T>` + `XCommandHandler(...) : IRequestHandler<XCommand, T>`, constructor primario. MediatR lo descubre solo (`AddMediatR` en `*.Application/DependencyInjection.cs`) |
| Query (lectura) | `*.Application/Queries/` | Par `IXQueries` + `XQueries`, registrado en DI. **No** pasa por MediatR |
| Endpoint | `*.API/Api/XApi.cs` | Minimal API estática (`MapXApiV1`): arma el command y hace `services.Mediator.Send(...)`, o llama a la query. Sin lógica de negocio |
| ApiServices | `*.API/ApiServices/` | Agregador `[AsParameters]` con `IMediator` + queries del recurso |
| Domain | `*.Domain` | Modelos, excepciones (`BusinessException`), interfaces `IXDao` / `IXProducer`, contratos de eventos. Sin `Microsoft.AspNetCore.*` ni `MongoDbQueryBuilder` |
| Infrastructure | `*.Infrastructure/Dao/` (namespace suele ser `<Servicio>.Repository.Dao`: copiar el del vecino) | DAO, `Entities`, AutoMapper, DI del conector |

Referencia real: `Module-FMS/Banks` (`Banks.API/Api/AccountApi.cs`, `Banks.Application/Commands/Accounts/CreateAccountCommandHandler.cs`).

## 3. DAO

```csharp
public class CatalogDao(IConnector connector, IMapper mapper)
    : TenantDao<CatalogEntity>(connector), ICatalogDao
{
    protected override string CollectionName => Collections.Catalogs;   // nunca string inline
    protected override string SubscriptionId => Subscription;

    public async Task<Catalog?> LoadCatalog(string id)
    {
        var query = new MongoDbQueryBuilder()
            .InCollection(CollectionName)
            .WithTenant(SubscriptionId)                                  // obligatorio
            .Where(new QueryStatement("_id", Condition.Equal, id))
            .Build();
        return mapper.Map<Catalog>(await _connector.LoadItem<CatalogEntity>(query));
    }
}
```

Referencia: `Module-POS/Synchronization/Synchronization.Infrastructure/Dao/CatalogDao.cs`.

- Hereda de `TenantDao<TEntity>`; tenant desde `IContextService.SubscriptionId`, **nunca** del request.
- `.NonTenant()` solo sobre catálogos globales, justificado. Ante la duda: `/norkut-core:tenant-isolation-check`.
- `CollectionName` desde `*.Infrastructure/Constants/Collections.cs`. Colección nueva o cambio de esquema en una existente → correr `/norkut-backend:mongo-collection` antes.
- Nunca `IMongoCollection` ni el driver directo. No mezclar `BackAegis.MongoDbConnector` con `MongoDbConnector` en un servicio: usar el que ya tiene el `.csproj`.
- `Entity ↔ Domain ↔ DTO` solo con `IMapper`; una `Entity` nunca sale por HTTP.

## 4. Evento de integración

Si el caso de uso cambia un estado que le importa a otro servicio, el handler publica un evento vía el `IXProducer` inyectado. Antes de crear o tocar un record de `IntegrationEvents/`: `/norkut-core:event-contract-check`. Consumers nuevos: idempotentes (el bus reentrega).

## 5. Tests y cierre

- Tests en `*.Tests` espejando la capa (xUnit + AutoFixture + Moq): handler con camino feliz y de error, DAO con el tenant verificado.
- `dotnet build` y `dotnet test` del servicio en verde. El restore necesita el feed NuGet privado (`gotchas.md` de norkut-core): si falla por credenciales, decirlo, no "arreglarlo" cambiando fuentes.
- Paquetes nuevos: verificar que existan y la versión contra los `.csproj` vecinos (`grep -rh PackageReference .`). No inventar versiones.
- Checklist final: namespaces file-scoped, un tipo público por archivo, DI por constructor primario contra interfaces, servicio nuevo registrado en `DependencyInjection` / `ServiceConfiguration`.
