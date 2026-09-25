# Contratos de eventos de integración

> Qué eventos cruzan repos, quién los emite y quién los consume. Listado relevado con un scan de `repos/`; para el detalle vivo de un evento puntual correr `/norkut-core:event-contract-check` (busca en todos los lenguajes).
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

Generada con `node scripts/scan-repos.js <ruta a repos/>` (kit). "Emite" y "Consumen" muestran `repo/servicio` cuando el código es Python.

| Evento | Emite | Consumen |
|---|---|---|
| StoreChanged | Module-LMS | BPM, CMS, FMS, FRM, IMS, Integrations/mercadopago_api, MobileClub, PIM, POS, SRM, TMS |
| InvoiceEmitted | CloudFunctions/pos-logs-integration | BPM, CBS, CRM, FMS, IA/api, IMS, IntegrationBridge, MobileClub, PIM, POS |
| CompanyCreated | Module-CMS | BPM, CSS, FMS, FRM, LMS, MobileClub, POS, PRM, SSM |
| ProductChanged | Module-PIM | CMS, HCM, IA/api, IMS, IntegrationBridge, Integrations/mercadolibre_api, MobileClub, POS |
| CompanyUpdated | Module-CMS | FMS, FRM, LMS, MobileClub, POS |
| CustomerChanged | CloudFunctions/pos-logs-integration, Module-CRM | FMS, IA/api, IntegrationBridge, POS |
| SubscriptionCreated | Module-LMS | CSS, Integrations/mercadopago_api, PRM, SSM, UMS/metering |
| UserChanged | Module-SSM | CMS, FRM, HCM, LMS, POS |
| PurchaseOrderSent | Module-SRM | BPM, CMS, HCM, IMS |
| StoreConfigUpdated | JobScheduler, Module-IMS | IA/api, IMS, MobileClub, POS |
| SubscriptionUpdated | Module-LMS | CSS, PRM, SSM, UMS/metering |
| TransferReceived | Module-TMS | HCM, IMS, Insights/insight, Integrations/mercadolibre_api |
| PurchaseOrderDirectReception | Module-SRM | FMS, IMS, Integrations/mercadolibre_api |
| PurchaseOrderReceived | Module-SRM | HCM, IMS, Integrations/mercadolibre_api |
| SalePointChanged | Module-POS | CMS, IntegrationBridge, Integrations/mercadopago_api |
| TransferSent | Module-TMS | HCM, IMS, Insights/insight |
| CampaignChanged | Module-CRM | IA/api, MobileClub |
| CountCompleted | Module-IMS | IntegrationBridge, Integrations/mercadolibre_api |
| IntegrateStore | Module-IntegrationBridge, Module-Integrations/mercadolibre_api | LMS |
| IntegrateUser | Module-IntegrationBridge, Module-Integrations/mercadolibre_api | SSM |
| NotifyPaymentStatus | Module-CSS, Module-PRM | LMS |
| NotifySubscriptionStatus | Module-CSS, Module-PRM | LMS |
| OwnerCreated | _no detectado_ | CMS, FRM, POS |
| PaymentOrderChanged | Module-LMS | CSS, PRM |
| ProductSupplierAdded | Module-PIM | IMS, SRM |
| PurchaseOrderClosed | Module-SRM | FMS, IMS |
| PurchaseOrderReceptionCancelled | Module-SRM | IMS, Integrations/mercadolibre_api |
| PurchaseOrderSupplierLinked | Module-SRM | IMS, PIM |
| ShiftEmitted | CloudFunctions/pos-logs-integration, Module-Integrations/mercadolibre_api | IntegrationBridge |
| SupplierChanged | Module-SRM | FMS, PIM |
| TransferCancelled | Module-TMS | IMS, Insights/insight |
| TransferReceptionVoided | Module-TMS | IMS, Integrations/mercadolibre_api |

## Eventos entre 2 repos que emite Python
| Evento | Emite | Consume |
|---|---|---|
| AdjustStock | Module-Integrations/mercadolibre_api | IMS |
| IntegrationManagementCreate | Module-POS (y Module-Integrations: mercadolibre_api, mercadopago_api, modo) | Integrations/integration_management |

## Request/response sobre el bus
- 2026-09 · scripts/scan-repos.js · `Module-Integrations/mercadolibre_api` pide datos a servicios .NET con requests sobre el bus: `GetPosInfoRequest` → Module-POS · `GetProductMovementsRequest` → Module-IMS · `GetProductRequest` → Module-PIM · `GetProductStockRequest` → Module-IMS · `GetStoreRequest` → Module-LMS. El contrato del request también es compartido.

- 2026-09 · scripts/scan-repos.js · 104 eventos detectados (C# y Python). En C# se detectan por contenido (`*Consumer<X>`, `<X>Producer.cs`, records de `Producers/` que usa un producer), no por el nombre de la carpeta, que no siempre coincide con el evento (p. ej. `Producers/Store/` publica `IntegrateStore`).
- 2026-09 · scripts/scan-repos.js · 12 con consumidor pero sin productor detectado: CampaignChangedEvent, CampaignVisibilityChanged, CreatePartnerUser, CreateStoreConfigRequest, GenerateSupplierAnalysis, GetCustomerRequest, GetExchangeRates, OwnerCreated, SyncCustomer, TokenRequest, UpdateCampaignStatusMessage, UpdateSubscriptionContract. Puede ser un productor fuera de `repos/`, un nombre armado en runtime o código muerto: verificar antes de asumir cualquiera de las tres.
