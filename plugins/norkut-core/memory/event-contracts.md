# Contratos de eventos de integración

> Qué eventos cruzan repos, quién los emite y quién los consume. Listado relevado con un scan de `repos/`; para el detalle vivo de un evento puntual correr `nk-event-contract` (busca en todos los lenguajes).
> `contract-guard` revisa: `**/IntegrationEvents/**/*.cs` (la carpeta vive en `*.Domain`, `*.Application` o `*.Actions` según el servicio).

## Cómo funciona el contrato
- 2026-09 · docs/eventos-mensajeria.md · MassTransit matchea por **namespace + nombre de tipo**: el contrato es `namespace IntegrationEvents.Events` + el nombre del `record`. Cada repo tiene su **copia** del record; cambiar una copia compila y pasa CI en todos los demás.
- 2026-09 · docs/eventos-mensajeria.md · Solo cambios aditivos. Propiedades nuevas nullable y sin `required`. No renombrar tipo, namespace ni `EndpointName` (kebab-case, estable).
- 2026-09 · docs/eventos-mensajeria.md · Hay consumers batcheados (`IConsumer<Batch<X>>`): buscar las dos formas antes de tocar un evento.
- 2026-09 · docs/eventos-mensajeria.md · Consumers idempotentes: el bus reentrega.
- 2026-09 · scan repos/ · Algunos productores son Lambdas Python que emiten con un string literal (`send_event_message(entity_event='InvoiceEmitted', ...)` en `CloudFunctions/pos-logs-integration`). Buscar solo en `*.cs` da productores falsos negativos.
- 2026-09 · scan repos/ · En Python (PyMassTransit) el contrato de cable es el mismo string: productores con `message_type = "urn:message:IntegrationEvents.Events:<Evento>"`; consumidores con `message_name = "<Evento>"` (y `message_type` por defecto `IntegrationEvents.Events`) o `exchange_name = "IntegrationEvents.Events:<Evento>"`. Los payloads se validan con schemas Pydantic propios de cada servicio: son otra copia del contrato.
- 2026-09 · scan repos/ · `message_type = "Integration.Internal"` (Module-Integrations) y los namespaces `Clover.IntegrationEvents.Events` y `Metering.IntegrationEvents.Events` son mensajes internos de un servicio, no contratos cross-repo.
- 2026-09 · onboarding · Política de versionado explícito de eventos: _por definir con el Arquitecto_ (gap junto con API versioning y contract testing). Hoy no hay versión en el nombre.

## Eventos con 3 o más repos involucrados

Entre paréntesis, el servicio Python que consume o produce.

| Evento | Emite | Consumen |
|---|---|---|
| StoreChanged | Module-LMS | BPM, CMS, FMS, FRM, IMS, Integrations (mercadopago_api), MobileClub, PIM, POS, SRM, TMS |
| InvoiceEmitted | CloudFunctions (Python) | BPM, CBS, CRM, FMS, IA (api), IMS, IntegrationBridge, MobileClub, PIM, POS |
| CompanyCreated | Module-CMS | BPM, CSS, FMS, FRM, LMS, MobileClub, POS, PRM, SSM |
| ProductChanged | Module-PIM | CMS, HCM, IA (api), IMS, IntegrationBridge, Integrations (mercadolibre_api), MobileClub, POS |
| CompanyUpdated | Module-CMS | FMS, FRM, LMS, MobileClub, POS |
| SubscriptionCreated | Module-LMS | CSS, Integrations (mercadopago_api), PRM, SSM, UMS (metering) |
| UserChanged | Module-SSM | CMS, FRM, HCM, LMS, POS |
| PurchaseOrderSent | Module-SRM | BPM, CMS, HCM, IMS |
| StoreConfigUpdated | JobScheduler, Module-IMS | IA (api), MobileClub, POS |
| SubscriptionUpdated | Module-LMS | CSS, PRM, SSM, UMS (metering) |
| CustomerChanged | CloudFunctions (Python) | FMS, IA (api), IntegrationBridge |
| PurchaseOrderReceived | Module-SRM | HCM, IMS, Integrations (mercadolibre_api) |
| TransferReceived | Module-TMS | IMS, Insights (insight), Integrations (mercadolibre_api) |
| TransferSent | Module-TMS | HCM, IMS, Insights (insight) |
| CampaignChanged | Module-CRM | IA (api), MobileClub |
| CountCompleted | Module-IMS | IntegrationBridge, Integrations (mercadolibre_api) |
| NotifyPaymentStatus / NotifySubscriptionStatus | Module-CSS, Module-PRM | LMS |
| PaymentOrderChanged | Module-LMS | CSS, PRM |
| ProductSupplierAdded | Module-PIM | IMS, SRM |
| PurchaseOrderClosed | Module-SRM | FMS, IMS |
| PurchaseOrderReceptionCancelled | Module-SRM | IMS, Integrations (mercadolibre_api) |
| PurchaseOrderSupplierLinked | Module-SRM | IMS, PIM |
| SalePointChanged | Module-POS | CMS, Integrations (mercadopago_api) |
| SalePointCreated | Module-POS | HCM, IntegrationBridge |
| ShiftEmitted | CloudFunctions (Python), Module-Integrations (mercadolibre_api) | IntegrationBridge |
| SupplierChanged | Module-SRM | FMS, PIM |
| TransferCancelled | Module-TMS | IMS, Insights (insight) |
| TransferReceptionVoided | Module-TMS | IMS, Integrations (mercadolibre_api) |
| OwnerCreated | _no detectado_ | CMS, FRM, POS |
| PurchaseOrderDirectReception | _no detectado_ | FMS, IMS, Integrations (mercadolibre_api) |

## Eventos entre 2 repos que emite Python
| Evento | Emite | Consume |
|---|---|---|
| AdjustStock | Module-Integrations (mercadolibre_api) | IMS |
| IntegrateStore | Module-Integrations (mercadolibre_api) | LMS |
| IntegrateUser | Module-Integrations (mercadolibre_api) | SSM |
| IntegrationManagementCreate | Module-POS, Module-Integrations (mercadolibre_api, mercadopago_api, modo) | Integrations (integration_management) |

- 2026-09 · scan repos/ · 115 eventos detectados (C# y Python); 26 con consumidor pero sin productor detectado (p. ej. OwnerCreated, PurchaseOrderDirectReception, ShiftClosed). Puede ser un productor fuera de `repos/`, un layout que el scan no reconoce o un nombre armado en runtime: verificar antes de asumir que es código muerto.
- 2026-09 · scan repos/ · `Module-Integrations/mercadolibre_api` además hace request/response sobre el bus (`GetProductRequest`, `GetStoreRequest`, `GetPosInfoRequest`, `GetProductStockRequest`, `GetProductMovementsRequest`). El contrato del request también es compartido; el scan todavía no releva quién los responde (carpetas `Requests/` de .NET).
