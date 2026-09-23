# Gotchas

- 2026-09 · JobScheduler/Job/Program.cs · Hangfire usa `UseMemoryStorage()`: los jobs encolados se pierden al reiniciar el servicio. No confiar en jobs diferidos para nada crítico hasta que se migre.
- 2026-09 · JobScheduler/Job/Program.cs · El dashboard de Hangfire (`/hangfire`) usa `DashboardNoAuthorizationFilter`: no tiene autorización. No exponerlo fuera de la red interna.
- 2026-09 · OnBoarding/07-devops-infra.md · Restore de paquetes depende de feeds NuGet privados (Azure DevOps + GitHub Packages, con `NUGET_USERNAME`/`NUGET_PASSWORD`): sin credenciales del feed el build falla en local y en CI.
- 2026-09 · onboarding · Observabilidad parcial en .NET: no todos los servicios emiten trazas; ante "no pasó nada" revisar logs del servicio directo.
- 2026-09 · onboarding · Los gates de staging no están documentados: preguntar al Arquitecto antes de asumir que algo se despliega solo.
- 2026-09 · docs/repo-map.md · No todos los repos usan `main`: `FrontFeatures-Corporate` usa `develop` y `TestAutomation` usa `feature/test-framework`. Verificar con `git symbolic-ref --short refs/remotes/origin/HEAD`.
