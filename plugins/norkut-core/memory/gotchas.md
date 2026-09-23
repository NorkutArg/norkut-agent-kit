# Gotchas

- 2026-09 · onboarding · Hangfire usa storage en memoria: los jobs encolados se pierden al reiniciar el servicio. No confiar en jobs diferidos para nada crítico hasta que se migre.
- 2026-09 · onboarding · El dashboard de Hangfire no tiene autorización. No exponerlo fuera de la red interna.
- 2026-09 · onboarding · Restore de paquetes depende del feed NuGet privado en Azure DevOps: sin credenciales del feed el build falla en local y en CI.
- 2026-09 · onboarding · Observabilidad parcial en .NET: no todos los servicios emiten trazas; ante "no pasó nada" revisar logs del servicio directo.
- 2026-09 · onboarding · Los gates de staging no están documentados: preguntar al Arquitecto antes de asumir que algo se despliega solo.
