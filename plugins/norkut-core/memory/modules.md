# Módulos, repos, owners

> Una fila por repo con lógica de negocio. "Emite" = eventos que consume **otro** repo (detalle y consumidores en `event-contracts.md`). Mapa completo de los 58 repos: `docs/repo-map.md` del workspace.
> Colecciones y eventos salen de un scan de `repos/` (constantes `*/Constants/Collections.cs` y carpetas `IntegrationEvents/Producers|Consumers/`). Es un relevamiento, no una garantía: antes de tocar un evento correr `nk-event-contract`.

- 2026-09 · scan repos/ · 14 repos .NET declaran 112 colecciones; 23 se repiten en más de un repo (tabla de abajo).
- 2026-09 · docs/repo-map.md · Un repo ≠ un servicio: `Module-POS` tiene 6 servicios (PointOfSale, StoreOperation, FiscalOperation, Synchronization, ExternalExchangeRate, ApiGateway).
- 2026-09 · docs/repo-map.md · `Module-CORP` está vacío (sin commits).

## Backend .NET

| Repo | Qué es | Vertical ClickUp | Owner | Emite (cross-repo) |
|---|---|---|---|---|
| Module-POS | Point of Sale (6 servicios) | POS | _por definir_ | SalePointCreated, SalePointChanged, ExchangeRateCreated |
| Module-CRM | Customer Relationship Mgmt · campañas y promociones | _por definir_ | _por definir_ | CampaignChanged, CampaignCustomersBatchChanged |
| Module-FMS | Financial Management System · cuentas a cobrar/pagar, retenciones | _por confirmar_ (figuraba "Fidelización") | _por definir_ | ReceivablesPaid, ReceivableReversed |
| Module-IMS | Inventory Management System · conteos, movimientos | Manejo Lotes | _por definir_ | CountCompleted, MovementUpdated, StoreConfigUpdated, StartBulkOperation |
| Module-LMS | License Management System · suscripciones | _por definir_ | _por definir_ | StoreChanged, SubscriptionCreated/Updated, PaymentOrderChanged, TokenRevoked, SendEmail |
| Module-PIM | Product Information Management | _por definir_ | _por definir_ | ProductChanged, ProductSupplierAdded |
| Module-SRM | Supplier Relationship Mgmt · órdenes de compra | _por definir_ | _por definir_ | PurchaseOrder* (7 eventos), SupplierChanged, BillChanged |
| Module-SSM | AuthBridge + Authorization · usa `.NonTenant()` legítimo | transversal | _por definir_ | UserChanged |
| Module-CMS | Configuration Mgmt · compañías, tiendas, monedas | _por definir_ | _por definir_ | CompanyCreated, CompanyUpdated, UserUpdated |
| Module-TMS | Transportation Mgmt · transferencias | _por definir_ | _por definir_ | TransferSent/Received/Cancelled/ReceptionVoided |
| Module-CBS | Customer Billing System · pockets | _por definir_ | _por definir_ | PocketMovementCreated |
| Module-CSS | Customer Service System · licencias | _por definir_ | _por definir_ | NotifyPaymentStatus, NotifySubscriptionStatus, CreatePartnerUser |
| Module-PRM | Partner Mgmt | _por definir_ | _por definir_ | NotifyPaymentStatus, NotifySubscriptionStatus, UserUpserted |
| Module-IntegrationBridge | Puente con sistemas externos | Bridge | _por definir_ | ExchangeRate, Store, User |
| Module-HCM, BPM, FRM, MobileClub, PaymentGateways | Solo consumen eventos cross-repo | _por definir_ | _por definir_ | — |
| Module-CORP | Vacío | Corporativo | _por definir_ | — |
| JobScheduler | Hangfire · jobs recurrentes | transversal | _por definir_ | StoreConfigUpdated, StoreConfigBatchUpdated, BulkExchangeRateUpdated, UpdateSubscription, ApplySubscriptionDowngrade |

## Python, Lambdas y apps

| Repo | Qué es | Vertical ClickUp | Owner | Notas |
|---|---|---|---|---|
| CloudFunctions | Lambdas (`pos-logs-integration`, cognito-*, …) | transversal | _por definir_ | **Productor** de InvoiceEmitted, CustomerChanged, ShiftEmitted, ZetaReportEmitted, MerchantEmitted (string literal en Python) |
| Module-Integrations | Integraciones (Python) | Integraciones | _por definir_ | |
| Module-IA | IA · RAG, agentes, pipelines Airflow | Reposición Inteligente | _por definir_ | |
| PointOfSaleApp | App POS (Flutter) | POS | _por definir_ | offline-first; conflict resolution _por documentar_ |
| MessagesSender | Librería NuGet de envío de mensajes | transversal | _por definir_ | |
| Front-Core | Shell Angular; consume las libs `@mele/*` | transversal | _por definir_ | un cambio en `FrontFeatures-*` no llega a prod sin publicar el paquete y subir la versión acá |

## Colecciones compartidas
Mismo nombre de colección declarado en más de un repo (repo/servicio). Antes de cambiar su esquema, avisar a todos.

| Colección | Repos que la declaran | Owner del esquema |
|---|---|---|
| `stores` | CMS/CompanyInformation, IMS/Counting, IMS/Inventory, MobileClub/ClubShopping, MobileClub/CustomerPromotion, POS/Synchronization, SRM/PurchaseOrder, SRM/Suppliers, TMS/Transference | _por definir_ |
| `companies` | BPM/SalesIndicators, CMS/CompanyInformation, CSS/LicenseManagement, FMS/TaxWithholdingManagement, LMS/SubscriptionInvoicer, MobileClub/ClubShopping, MobileClub/CustomerPromotion, POS/Synchronization, PRM/PartnerManagement | _por definir_ |
| `users` | CSS/LicenseManagement, MobileClub (3 servicios), POS/Synchronization, PRM/PartnerManagement | _por definir_ |
| `currencies` | CMS/CompanyInformation, MobileClub/CustomerPromotion, SRM/PurchaseOrder, SRM/Suppliers | _por definir_ |
| `banks` | CSS/LicenseManagement, FMS/TaxWithholdingManagement, PRM/PartnerManagement, SRM/Suppliers | _por definir_ |
| `payment_methods` | FMS/AccountsReceivable, FMS/TaxWithholdingManagement, SRM/PurchaseOrder, SRM/Suppliers | _por definir_ |
| `customers` | CRM/CustomerManagement, FMS/AccountsReceivable, POS/Synchronization | _por definir_ |
| `products` | IMS/Inventory, MobileClub/ClubShopping, POS/Synchronization | _por definir_ |
| `suppliers` | FMS/TaxWithholdingManagement, SRM/PurchaseOrder, SRM/Suppliers | _por definir_ |
| `campaigns`, `campaign_usages` | CRM/PromotionProfile, CRM/TenantPromotion, MobileClub/CustomerPromotion | _por definir_ |
| `invoices` | FMS/TaxWithholdingManagement, SRM/PurchaseOrder | _por definir_ |
| `receptions` | SRM/PurchaseOrder, TMS/Transference | _por definir_ |
| `sales` | BPM/SalesIndicators, CRM/CustomerManagement | _por definir_ |
| `catalog_currencies` | CMS/CompanyInformation, MobileClub/ClubShopping | _por definir_ |
| `import_logs` | CRM/CustomerManagement, SRM/Suppliers | _por definir_ |
| `subscriptions`, `plans`, `features`, `billing-cycles`, `payment-orders`, `reasons-activation`, `reasons-rejection` | CSS/LicenseManagement, PRM/PartnerManagement | _por definir_ |

- 2026-09 · scan repos/ · Que dos servicios declaren el mismo nombre no prueba que usen la misma base: confirmar con el Arquitecto si cada servicio tiene base propia antes de tratarla como acoplamiento real.
