# Contratos de eventos de integración

> Qué eventos cruzan repos, quién los emite y quién los consume. Listado relevado con un scan de `repos/`; para el detalle vivo de un evento puntual correr `nk-event-contract` (busca en todos los lenguajes).
> `contract-guard` revisa: `**/IntegrationEvents/**/*.cs` (la carpeta vive en `*.Domain`, `*.Application` o `*.Actions` según el servicio).

## Cómo funciona el contrato
- 2026-09 · docs/eventos-mensajeria.md · MassTransit matchea por **namespace + nombre de tipo**: el contrato es `namespace IntegrationEvents.Events` + el nombre del `record`. Cada repo tiene su **copia** del record; cambiar una copia compila y pasa CI en todos los demás.
- 2026-09 · docs/eventos-mensajeria.md · Solo cambios aditivos. Propiedades nuevas nullable y sin `required`. No renombrar tipo, namespace ni `EndpointName` (kebab-case, estable).
- 2026-09 · docs/eventos-mensajeria.md · Hay consumers batcheados (`IConsumer<Batch<X>>`): buscar las dos formas antes de tocar un evento.
- 2026-09 · docs/eventos-mensajeria.md · Consumers idempotentes: el bus reentrega.
- 2026-09 · scan repos/ · Algunos productores son Lambdas Python que emiten con un string literal (`send_event_message(entity_event='InvoiceEmitted', ...)` en `CloudFunctions/pos-logs-integration`). Buscar solo en `*.cs` da productores falsos negativos.
- 2026-09 · onboarding · Política de versionado explícito de eventos: _por definir con el Arquitecto_ (gap junto con API versioning y contract testing). Hoy no hay versión en el nombre.

## Eventos con 3 o más repos involucrados

| Evento | Emite | Consumen |
|---|---|---|
| StoreChanged | Module-LMS | BPM, CMS, FMS, FRM, IMS, MobileClub, PIM, POS, SRM, TMS |
| CompanyCreated | Module-CMS | BPM, CSS, FMS, FRM, LMS, MobileClub, POS, PRM, SSM |
| InvoiceEmitted | CloudFunctions (Python) | BPM, CBS, CRM, FMS, IMS, IntegrationBridge, MobileClub, PIM, POS |
| ProductChanged | Module-PIM | CMS, HCM, IMS, IntegrationBridge, MobileClub, POS |
| CompanyUpdated | Module-CMS | FMS, FRM, LMS, MobileClub, POS |
| UserChanged | Module-SSM | CMS, FRM, HCM, LMS, POS |
| PurchaseOrderSent | Module-SRM | BPM, CMS, HCM, IMS |
| StoreConfigUpdated | JobScheduler, Module-IMS | MobileClub, POS |
| SubscriptionCreated / SubscriptionUpdated | Module-LMS | CSS, PRM, SSM |
| NotifyPaymentStatus / NotifySubscriptionStatus | Module-CSS, Module-PRM | LMS |
| PaymentOrderChanged | Module-LMS | CSS, PRM |
| ProductSupplierAdded | Module-PIM | IMS, SRM |
| PurchaseOrderClosed | Module-SRM | FMS, IMS |
| PurchaseOrderReceived | Module-SRM | HCM, IMS |
| PurchaseOrderSupplierLinked | Module-SRM | IMS, PIM |
| SupplierChanged | Module-SRM | FMS, PIM |
| TransferSent | Module-TMS | HCM, IMS |
| CustomerChanged | CloudFunctions (Python) | FMS, IntegrationBridge |
| OwnerCreated | _no detectado_ | CMS, FRM, POS |

- 2026-09 · scan repos/ · 108 eventos detectados en total; 28 con consumidor pero sin productor detectado por el scan (p. ej. OwnerCreated, PurchaseOrderDirectReception, ShiftClosed). Puede ser un productor fuera de `repos/` o un layout que el scan no reconoce: verificar antes de asumir que es código muerto.
