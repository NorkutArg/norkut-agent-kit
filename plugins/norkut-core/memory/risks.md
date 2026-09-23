# Riesgos conocidos y cómo se chequean

| Riesgo | Por qué importa | Cómo se detecta | Skill / hook |
|---|---|---|---|
| Aislamiento multitenant | No se nota sin test explícito; una query sin filtro de tenant filtra datos entre clientes | Test de aislamiento por repositorio; `TenantId` viene del contexto, nunca del request | `tenant-isolation-check`, `tenant-guard` |
| Drift de contratos de eventos | Un módulo cambia el payload y los consumidores fallan en silencio o leen mal | Diff contra `event-contracts.md`; consumidores listados en `modules.md` | `event-contract-check`, `contract-guard` |
| Colecciones Mongo compartidas | Acoplamiento implícito: un cambio de esquema rompe otro módulo | `modules.md` → tabla de compartidas; avisar al otro owner | `pr-review` |
| Consistencia eventual | QA reporta "no aparece" cuando en realidad todavía no se procesó el evento | Criterios de aceptación con tiempo de espera y qué observar | `feature-kickoff`, `pr-review` |
| Ritmo IA > capacidad de review | PRs grandes y frecuentes; el review es el cuello de botella | Límite de tamaño de PR; review estructurado | `pr-review`, `dod-check` |
| Infra | Hangfire con storage en memoria (se pierden jobs al reiniciar); dashboard sin autorización; observabilidad parcial en .NET; dependencia del feed NuGet privado | Ver `gotchas.md` | — |

- 2026-09 · onboarding · Origen de la lista: documentación de onboarding + síntesis de riesgos del TPM.
