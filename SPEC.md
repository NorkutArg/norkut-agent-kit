# norkut-agent-kit — Spec

> Harness unificado, set único de skills y memoria compartida para el equipo Norkut, usando Claude Code + Cursor sobre los repos de la org `NorkutArg`.
> Estado: v0.1 — draft para implementar con Claude Code. Owner: Diego (TPM).

## 1. Problema

- Cada dev tiene su propia config de Claude Code / Cursor: MCPs distintos, skills copiadas a mano, `CLAUDE.md` inconsistentes o inexistentes.
- El código vive en 11+ repos (`Module-*`, `Front-*`, `PointOfSaleApp`, `MessagesSender`…). Una vertical toca varios repos, así que el conocimiento cross-repo (contratos de eventos, ownership de módulos, gotchas de infra) no tiene un lugar único.
- La velocidad de desarrollo asistido por IA supera la capacidad de review. Los agentes hoy no conocen los riesgos que más importan (aislamiento multitenant, drift de contratos, colecciones Mongo compartidas, consistencia eventual).
- Lo que un dev aprende trabajando con Claude queda en su auto memory local y nunca llega al resto.

## 2. Objetivos

| # | Objetivo | Métrica de éxito |
|---|---|---|
| O1 | Un solo comando deja a cualquier dev con la misma config en Claude Code y Cursor | `npx @norkutarg/agent-kit init` en máquina limpia → sesión funcional en < 5 min |
| O2 | Un set único de skills, versionado, con owner | 100% de skills del equipo vienen del marketplace; ninguna copiada a mano en repos |
| O3 | Memoria compartida versionada y revisable por PR | Contratos de eventos, ownership y gotchas viven en un solo lugar y se cargan en todos los repos |
| O4 | Los agentes aplican los riesgos conocidos en cada PR | El skill `pr-review` corre en todos los PRs y chequea la lista de riesgos |
| O5 | Flujo de promoción de aprendizajes individuales a compartidos | ≥1 PR/semana a `memory/` durante el primer trimestre |

## 3. No-objetivos

- No reemplaza ClickUp, GitHub ni el proceso de release del Arquitecto.
- No unifica la auto memory de Claude Code entre máquinas (es machine-local por diseño). Lo que se unifica es la memoria **explícita y commiteada**.
- No cubre Copilot, Windsurf ni otras herramientas: solo Claude Code y Cursor.
- No mete secretos en ningún archivo commiteado.

## 4. Arquitectura

### 4.1 Capas de contexto (de más global a más personal)

```
1. Plugin norkut-core        skills + agents + hooks + MCPs + memoria cross-repo   ← kit, versionado
2. CLAUDE.md de cada repo    stack, comandos, módulos que toca, convenciones        ← commiteado por repo
3. .claude/rules/*.md        reglas scoped por path (glob)                         ← commiteado por repo
4. .agent/memory/            decisiones y gotchas del repo                          ← commiteado por repo
5. CLAUDE.local.md           URLs de sandbox, tokens, preferencias de cada dev      ← gitignored
6. Auto memory de Claude     notas personales que Claude escribe solo               ← local, no se comparte
```

Cursor no lee `CLAUDE.md` (solo `.cursor/rules/` y `AGENTS.md`): `sync` genera `.cursor/rules/01-repo-instructions.mdc` (`alwaysApply: true`), que adjunta `@CLAUDE.md` y `@.agent/memory/MEMORY.md` por referencia, sin copiarlos. Las reglas por path se mantienen en `.agent/rules/` (fuente canónica) y el kit genera `.claude/rules/*.md` y `.cursor/rules/*.mdc` a partir de ahí. Cuando la versión de Cursor del equipo lea `.claude/skills/` y `.claude/rules/` de forma nativa, el generador se elimina.

### 4.2 Distribución

| Componente | Mecanismo | Scope |
|---|---|---|
| Marketplace + plugins | `claude plugin marketplace add NorkutArg/norkut-agent-kit` | Usuario (`~/.claude`). La versión la pinea el kit, no cada repo |
| Bootstrap | `npx @norkutarg/agent-kit init` (publicado en GitHub Packages; cada dev configura `~/.npmrc` una vez, ver README) | Máquina del dev |
| Sync por repo | `npx @norkutarg/agent-kit sync` desde la raíz de un repo | Genera/actualiza `CLAUDE.md` (solo si no existe), `.claude/rules/`, `.cursor/rules/`, `.agent/` |
| Memoria cross-repo | Viaja dentro del plugin (`plugins/norkut-core/memory/`) y se expone vía skill `norkut-context` | Todos los repos |
| Memoria por repo | `.agent/memory/` en cada repo | Ese repo |

Decisión (2026-09): el CLI se publica en **GitHub Packages** como `@norkutarg/agent-kit` (el scope tiene que ser la org). La versión del CLI pinea la de los plugins: `init` y `update` agregan el marketplace como `NorkutArg/norkut-agent-kit@v<versión>`, el tag que crea el release.

Decisión: plugins a scope **usuario**, no proyecto. El scope proyecto tuvo bugs reportados en 2026 (plugins que aparecen instalados pero no cargan). `init` garantiza que todos tengan la misma versión.

### 4.3 Estructura del repo `norkut-agent-kit`

```
norkut-agent-kit/
├── .claude-plugin/marketplace.json
├── plugins/
│   ├── norkut-core/                 # obligatorio para todos
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── norkut-context/      # expone la memoria cross-repo
│   │   │   ├── feature-kickoff/     # kickoff → plan para validar con Arquitecto/PM
│   │   │   ├── pr-review/           # review contra la lista de riesgos + DoD
│   │   │   ├── dod-check/           # checklist de definition of done
│   │   │   ├── event-contract-check/# detecta drift en eventos de integración
│   │   │   ├── tenant-isolation-check/
│   │   │   └── promote-learning/    # auto memory → PR a memory/
│   │   ├── agents/
│   │   │   ├── reviewer.md          # revisor con la lista de riesgos cargada
│   │   │   └── qa-staging.md        # genera plan de validación en staging
│   │   ├── hooks/hooks.json         # guardrails (ver 4.6)
│   │   ├── memory/                  # memoria cross-repo (ver 4.5)
│   │   └── .mcp.json                # ClickUp, GitHub, Mongo (read-only)
│   ├── norkut-backend/              # .NET, DDD, MediatR/CQRS, Mongo, Hangfire
│   ├── norkut-frontend/             # Angular, Front-Core, FrontFeatures-*
│   └── norkut-pm/                   # status report, resumen de dailies, roadmap
├── templates/
│   ├── CLAUDE.md.template
│   ├── CLAUDE.local.md.example
│   ├── agent-memory/MEMORY.md
│   ├── rules/*.md                   # reglas base para .agent/rules/
│   └── gitignore.snippet
├── bin/cli.js                       # init | sync | doctor | update
├── CHANGELOG.md
└── README.md
```

### 4.4 CLI (`@norkutarg/agent-kit`)

| Comando | Qué hace |
|---|---|
| `init` | Verifica Claude Code y Cursor instalados; agrega el marketplace; instala `norkut-core` + el plugin del rol (`backend`/`frontend`/`pm`); imprime qué env vars faltan para los MCPs del plugin. No escribe config de MCP propia (los MCPs viajan en el plugin) ni `~/.claude/CLAUDE.md` |
| `sync` | En la raíz de un repo: crea `CLAUDE.md` desde template si no existe (nunca lo pisa), regenera `.claude/rules/` y `.cursor/rules/` desde `.agent/rules/`, crea `.agent/memory/MEMORY.md` si falta, agrega el snippet al `.gitignore` |
| `doctor` | Reporta versión del kit, plugins instalados, MCPs alcanzables, env vars faltantes, drift entre `.agent/rules/` y los generados |
| `update` | `claude plugin update` de los plugins Norkut + reinstala la versión pineada |

Todo es idempotente. Nada escribe credenciales: los tokens se leen de env vars y `doctor` avisa cuáles faltan.

### 4.5 Memoria compartida

**Cross-repo** (`plugins/norkut-core/memory/`, viaja con el plugin):

```
memory/
├── MEMORY.md            # índice, < 150 líneas
├── modules.md           # módulo → repo(s) → owner → colecciones Mongo que toca → eventos que emite/consume
├── event-contracts.md   # contratos de eventos de integración entre módulos, con versión
├── risks.md             # los riesgos conocidos y cómo se chequean (multitenant, drift, coupling, eventual consistency)
├── workflow.md          # kickoff → plan validado → to do → in progress → qa testing → completed; estados ClickUp; branch naming con ID de ClickUp
├── gotchas.md           # Hangfire memory storage, feed NuGet privado, dashboard sin auth, etc.
└── decisions/           # ADRs cross-cutting (API versioning, conflict resolution POS offline…)
```

El skill `norkut-context` tiene como descripción "cargar contexto de módulos, contratos, riesgos y workflow de Norkut" y le indica a Claude qué archivo leer según la pregunta. No se carga todo siempre: Claude lee `MEMORY.md` y de ahí salta al archivo relevante.

Para Cursor, `sync` genera `.cursor/rules/00-norkut-context.mdc` (`alwaysApply: true`) con un resumen de 30 líneas de `MEMORY.md` y `risks.md`, y referencias a los archivos completos que el kit copia en `.agent/shared/` (gitignored, regenerado por `sync`).

**Por repo** (`.agent/memory/`, commiteado):

```
.agent/memory/
├── MEMORY.md        # índice
├── decisions/       # ADRs propios del repo
└── gotchas.md       # lo que rompe en este repo
```

`CLAUDE.md` del repo importa `@.agent/memory/MEMORY.md`.

**Flujo de promoción**: skill `promote-learning`. El dev corre `/norkut-core:promote-learning`, Claude lee su auto memory local, propone qué líneas son de interés colectivo, las reescribe al formato del archivo destino (cross-repo o por repo), y abre un PR contra el kit o contra el repo. Nada se promueve sin PR.

**Reglas de la memoria**:
- Solo hechos y decisiones. Nada de opiniones, nada de estado transitorio ("estamos en la migración X" sale cuando termina).
- Cada línea con fecha y origen (`2026-09 · PR #123` o `2026-09 · daily POS`).
- `MEMORY.md` nunca supera 150 líneas; lo que crece se mueve a un archivo propio.
- Revisión trimestral: el owner del plugin borra lo que ya no aplica.

### 4.6 Hooks (guardrails)

| Hook | Trigger | Acción |
|---|---|---|
| `tenant-guard` | `PreToolUse` en `Edit`/`Write` sobre `**/*Repository*.cs`, `**/*Handler*.cs`, `**/*Dao*.cs` | Recuerda (no bloquea) que toda query a Mongo debe filtrar por tenant y sugiere correr `tenant-isolation-check` |
| `contract-guard` | `PreToolUse` en `Edit`/`Write` sobre archivos de eventos de integración | Recuerda la regla del contrato (solo cambios aditivos, sin renombrar tipo, namespace ni `EndpointName`) y pide listar productores y consumidores. Los eventos no tienen versión: el contrato es namespace + nombre del `record` |
| `branch-guard` | `PreToolUse` en `Bash` con `git checkout -b` / `git push` | Avisa si el branch no contiene un ID de ClickUp (`CU-xxxx`), para que la integración GitHub–ClickUp linkee solo |
| `secret-guard` | `PreToolUse` en `Write` | Bloquea escrituras que matcheen patrones de tokens/connection strings |

Los hooks empiezan en modo aviso salvo `secret-guard`. Se endurecen cuando el equipo los adopta. Solo actúan en repos con remoto `NorkutArg`, porque el plugin corre en todos los proyectos del dev.

### 4.7 MCPs incluidos

| MCP | Uso | Credencial |
|---|---|---|
| ClickUp | Leer tareas, cambiar estados, comentar | `CLICKUP_API_TOKEN` (env). Plan Free: cuidado con el límite de llamadas |
| GitHub | PRs, issues, búsqueda de código cross-repo | `GITHUB_TOKEN` (env) |
| MongoDB (read-only) | Inspeccionar esquemas y colecciones en staging | `MONGO_RO_URI` (env), solo staging |

## 5. Skills — set único

| Skill | Plugin | Descripción |
|---|---|---|
| `norkut-context` | core | Carga la memoria cross-repo según la pregunta |
| `feature-kickoff` | core | Toma una tarea de ClickUp, identifica repos y módulos afectados, contratos que toca, riesgos, y produce un plan para validar con Arquitecto/PM. Mueve la tarea a `planning` |
| `pr-review` | core | Review de un PR contra `risks.md` + DoD. Output: comentario estructurado listo para pegar en GitHub |
| `dod-check` | core | Checklist de definition of done antes de mover a `qa testing` |
| `event-contract-check` | core | Diff de contratos de eventos entre la rama y `event-contracts.md` |
| `tenant-isolation-check` | core | Busca queries sin filtro de tenant en el diff |
| `promote-learning` | core | Auto memory → PR a memoria compartida |
| `dotnet-module` | backend | Convenciones DDD/MediatR del proyecto para crear un handler/aggregate/repository |
| `mongo-collection` | backend | Antes de tocar una colección: quién más la usa (desde `modules.md`) |
| `angular-feature` | frontend | Convenciones de Front-Core y FrontFeatures-* |
| `status-report` | pm | Highlights de dailies por período (migra el `norkut-status-report` existente) |
| `daily-summary` | pm | Resumen ejecutivo de las transcripciones Tactiq de un día |

Cada skill: `SKILL.md` con frontmatter (`name`, `description`), < 300 líneas, referencias a archivos en `memory/` en vez de duplicar contenido.

## 6. Governance

- Un owner por plugin. `core` y `pm`: Diego. `backend` y `frontend`: a definir con el Arquitecto.
- Cambios al kit por PR con review del owner. Versionado semver; `CHANGELOG.md` obligatorio.
- Cambios a `memory/` cross-repo: PR con review del owner del módulo afectado (según `modules.md`).
- Revisión trimestral de skills: se borra lo que no se usó en 90 días (medido a mano al principio: encuesta rápida en la daily).
- Un skill nuevo entra al kit solo si ya lo usaron ≥2 personas fuera del kit.

## 7. Seguridad

- Nada de credenciales en el repo ni en el plugin. Solo nombres de env vars.
- `.mcp.json` del kit solo declara servers; los tokens vienen de env.
- Mongo solo con usuario read-only y solo staging.
- `secret-guard` bloqueante desde el día uno.

## 8. Rollout

| Fase | Alcance | Criterio de salida |
|---|---|---|
| 0 | Kit funcional con `core` + `pm`, probado por Diego en 2 repos | `init` + `sync` corren limpio en máquina limpia |
| 1 | Piloto con el Arquitecto + 1 dev backend + 1 dev frontend en sus repos | 3 PRs revisados con `pr-review`; feedback incorporado |
| 2 | Todo el equipo; `sync` corrido en todos los repos `NorkutArg` | 100% de repos con `CLAUDE.md` y `.agent/` |
| 3 | Hooks pasan de aviso a bloqueo (`contract-guard`, `tenant-guard`) | Acuerdo en retro; 0 falsos positivos en 2 semanas |

## 9. Abierto

- Si el MCP de Mongo entra en `core` o queda como opcional en `backend`.
- Qué versión de Cursor usa el equipo y si ya lee `.claude/rules/` y `.claude/skills/`.
- Owners de `backend` y `frontend`.
