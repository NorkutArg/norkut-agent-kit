---
name: angular-feature
description: Crear o modificar una funcionalidad en el frontend Angular de Norkut siguiendo las convenciones reales — standalone components, NgRx de 5 archivos, reutilización de @mele/*, URLs desde environment/window['env'], i18n con @ngx-translate — y el ciclo de publicación de FrontFeatures-* hacia Front-Core. Usar cuando piden una pantalla, componente, store o llamada a API en un repo Front-* o FrontFeatures-*.
---

# Funcionalidad Angular

## 1. Ubicar dónde va el código

| Repo | Qué es | Dónde va el código |
|---|---|---|
| `Front-Core` | Shell de producción: consume las libs `@mele/*` como paquetes npm y las carga con lazy routes | `src/` del shell; solo lo transversal (layout, guards, interceptores, providers) |
| `Front-Library` | Origen de `@mele/components`, `@mele/common`, `@mele/pipes`, `@mele/interfaces` | Componentes reutilizables entre features |
| `FrontFeatures-<X>` | Monorepo Nx que publica `@mele/<x>` | **`libs/<x>/`**. `apps/mele-core/` es un shell solo para desarrollo local |
| Otros `Front-*` | Apps independientes (Auth, Onboarding, BackOffice…) | `src/` de la app |

Antes de escribir: branch por defecto real (`git symbolic-ref --short refs/remotes/origin/HEAD`; `FrontFeatures-Corporate` usa `develop`), y abrir un componente/feature reciente del mismo lib para imitarlo.

## 2. Reglas

- **Reusar `@mele/*` antes de reimplementar**, en especial `@mele/components`. Buscar primero en `node_modules/@mele/` o en `Front-Library`.
- **Standalone components**, uno por archivo. Providers globales en `app.config.ts`.
- **NgRx con 5 archivos** (actions, reducer, effects, selectors, state), registrado en el store y en los effects.
- **Nada de `HttpClient` en componentes** para datos compartidos: componente → acción → effect → servicio. El servicio usa `HttpClient`.
- **URLs desde `environment`**, alimentado en runtime por `window['env']` (`env.js`). Nunca hardcodear host, puerto ni routeId. Una clave nueva va en `env.js` / `env.template.js` del shell y en la config del deploy: avisarlo en el PR.
- **Auth y tenant por `HttpconfigInterceptor`** (`@mele/core`); no armar headers a mano.
- **Textos por `@ngx-translate`**, nunca literales en el template. En `FrontFeatures-*` se prueban en `apps/mele-core/public/i18n/{es,en}.json` y **se migran a `Front-Core`** antes de cerrar.
- **Estado que depende de un evento backend**: mostrar "pendiente" hasta la confirmación; nunca asumir lectura inmediata después de escribir (consistencia eventual).
- No romper el cache busting (hashing de assets, `index.html` con `no-store`) al tocar el build.
- Versiones de Angular, NgRx y demás: las del `package.json` del repo. No sugerir upgrades de paso.

## 3. Comandos

Salen del `package.json` del repo; verificarlos ahí antes de correrlos.

```bash
# FrontFeatures-*
npm run start:local          # shell de desarrollo
npx nx build <feature>
npx nx test <feature>
npm run lint

# Front-*
npm start
npm run lint
```

No levantar servidores para "probar" si el usuario no lo pidió: avisar qué habría que verificar.

## 4. Llegar a producción (FrontFeatures-*)

Un PR mergeado en `FrontFeatures-<X>` **no está en producción** ni en staging:

1. Publicar el paquete `@mele/<x>` (bump de versión de la lib).
2. PR en `Front-Core` subiendo la versión de `@mele/<x>` en `package.json`. Las `@mele/*` están en `^0.0.x`, que fija el patch: sin editar `package.json`, la versión nueva no entra.
3. Migrar las claves i18n nuevas a `Front-Core` en ese mismo PR.

Decirlo explícitamente en el PR de la lib y en la tarea de ClickUp (`/norkut-core:dod-check`, ítem 10).

## 5. Checklist

- [ ] Standalone; globales en `app.config.ts`.
- [ ] Reusé `@mele/*`.
- [ ] NgRx con los 5 archivos y registrado; sin `HttpClient` en componentes.
- [ ] Sin URLs, puertos ni routeIds hardcodeados; claves nuevas de `env.js` avisadas.
- [ ] Textos por `@ngx-translate`; claves migradas a `Front-Core` si es `FrontFeatures-*`.
- [ ] `npm run lint` limpio; build de la librería OK.
- [ ] Si es `FrontFeatures-*`: el PR dice que falta publicar el paquete y subir la versión en `Front-Core`.
