# Riesgos conocidos y cómo se chequean

| Riesgo | Por qué importa | Cómo se detecta | Skill / hook |
|---|---|---|---|
| Aislamiento multitenant | No se nota sin test explícito; una query sin filtro de tenant filtra datos entre clientes | Test de aislamiento por repositorio; `TenantId` viene del contexto, nunca del request | `tenant-isolation-check`, `tenant-guard` |
| Drift de contratos de eventos | Un módulo cambia el payload y los consumidores fallan en silencio o leen mal | Diff contra `event-contracts.md`; consumidores listados en `modules.md` | `event-contract-check`, `contract-guard` |
| Colecciones Mongo compartidas | Acoplamiento implícito: un cambio de esquema rompe otro módulo | `modules.md` → tabla de compartidas; avisar al otro owner | `pr-review` |
| Consistencia eventual | QA reporta "no aparece" cuando en realidad todavía no se procesó el evento | Criterios de aceptación con tiempo de espera y qué observar | `feature-kickoff`, `pr-review` |
| Ritmo IA > capacidad de review | PRs grandes y frecuentes; el review es el cuello de botella | Límite de tamaño de PR; review estructurado | `pr-review`, `dod-check` |
| Alucinación del conector Mongo | El agente inventa métodos del conector o usa `IMongoCollection` directo (prohibido) | Todo acceso por `BackAegis.MongoDbConnector`; no mezclar con `MongoDbConnector` legacy en un mismo servicio | `pr-review` |
| Cruce de capas | Tipos de ASP.NET o builders de Mongo en `*.Domain`; `HttpClient` directo en componentes Angular | Revisar imports por capa | `pr-review` |
| Consumers no idempotentes | El bus reentrega; un `insert` sin chequeo duplica datos | Consumer chequea existencia o hace upsert | `pr-review` |
| Versiones inventadas | El agente sugiere paquetes o versiones que no existen | Verificar contra `.csproj` / `package.json` / `requirements.txt` | `pr-review` |
| Secretos | Connection strings hardcodeadas o `.env` commiteado | Config por `appsettings` / env vars | `secret-guard` |
| Infra | Hangfire con storage en memoria (se pierden jobs al reiniciar); dashboard sin autorización; observabilidad parcial en .NET; dependencia del feed NuGet privado | Ver `gotchas.md` | — |

- 2026-09 · onboarding · Origen de la lista: documentación de onboarding + síntesis de riesgos del TPM.
- 2026-09 · OnBoarding/10-flujo-de-trabajo-con-agentes.md · Filas de alucinación del conector, cruce de capas, idempotencia, versiones inventadas y secretos: tabla "Límites de la IA en este proyecto".
