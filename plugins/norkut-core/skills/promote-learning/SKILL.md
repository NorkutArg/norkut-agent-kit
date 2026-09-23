---
name: promote-learning
description: Promover aprendizajes de la auto memory personal de Claude Code a la memoria compartida de Norkut — revisa las notas locales, propone cuáles son de interés colectivo (gotchas, decisiones, cambios de ownership o contratos), las reescribe al formato del archivo destino y abre un PR contra el kit (memoria cross-repo) o contra el repo actual (.agent/memory/). Usar cuando alguien dice "esto lo tendría que saber todo el equipo", al cerrar una feature, o una vez por semana.
---

# Promote learning

## Pasos

1. **Leer la auto memory local**: `~/.claude/projects/<proyecto-actual>/memory/MEMORY.md` y sus archivos de tema. Si también se pasan notas sueltas o un mensaje, incluirlas.
2. **Clasificar cada nota** en una de:
   - `cross-repo` → va al kit (repo `NorkutArg/norkut-agent-kit`, carpeta `plugins/norkut-core/memory/`): afecta a más de un repo, a un contrato, a ownership, a infra, al workflow.
   - `repo` → va a `.agent/memory/` del repo actual: solo aplica acá.
   - `personal` → se queda en la auto memory. Preferencias, atajos, cosas de la máquina del dev.
   - `transitorio` → no se promueve. Estado de una tarea, bugs que ya se arreglaron.
3. **Antes de proponer**, leer el archivo destino actual en `${CLAUDE_PLUGIN_ROOT}/memory/` (o `.agent/memory/`) para no duplicar ni contradecir sin avisar.
4. **Elegir archivo destino** según el tipo: `gotchas.md`, `modules.md`, `event-contracts.md`, `risks.md`, `workflow.md` o un ADR nuevo en `decisions/`.
5. **Reescribir** cada línea al formato: `- YYYY-MM · <origen: PR #, daily, incidente> · <hecho o decisión, una línea, sin opinión>`. ADRs: título, contexto, decisión, consecuencias, en < 30 líneas.
6. **Mostrar la propuesta** al usuario: tabla nota → destino → texto final. Esperar confirmación y ediciones.
7. **Abrir el PR** (cross-repo: contra `NorkutArg/norkut-agent-kit`, verificando su branch por defecto con `git symbolic-ref --short refs/remotes/origin/HEAD`): branch `memory/<slug>`, commit en español, PR con la tabla del paso 6 como descripción, reviewer = owner del módulo afectado según `modules.md` (o Diego para cross-cutting).

## Reglas
- Nunca promover nada sin confirmación explícita.
- Nunca copiar credenciales, URLs de sandbox personales ni nombres de máquinas.
- Si `MEMORY.md` destino supera 150 líneas después del cambio, proponer mover una sección a un archivo propio en el mismo PR.
- Si la nota contradice algo que ya está en la memoria, marcarlo: el PR reemplaza la línea vieja y deja `(reemplaza: …)`.
