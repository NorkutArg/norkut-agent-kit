---
name: start-task
description: Empezar a trabajar en una tarea de ClickUp de Norkut — arma el nombre del branch con la convención del equipo (`CU-<id>_<descripcion-corta>_<Nombre-Apellido>`), lo crea desde el branch por defecto real y propone el commit `CU-<id>[in progress]` que mueve la tarea en ClickUp. Usar cuando alguien dice "arranco con CU-xxxx", "creá el branch para esta tarea" o después de un kickoff con el plan validado.
---

# Empezar una tarea

Convención completa: `${CLAUDE_PLUGIN_ROOT}/memory/workflow.md`, sección "Branches y PRs".

Input: ID (`CU-86e3cxn84` o `86e3cxn84`) o URL de la tarea. Opcional: descripción corta y prefijo de tipo (`feat`, `fix`…).

## Pasos

1. **Título de la tarea**: una sola llamada al MCP de ClickUp para leer el nombre (el plan Free corta en 100 llamadas por día). Si no responde, está en el límite o el usuario pasó una descripción, usar esa.
2. **Descripción corta**: 2–5 palabras del título que identifiquen el cambio, separadas por guiones, sin acentos ni símbolos, primera letra en mayúscula. Ej.: "Scaffolding inicial del kit de agentes" → `Scaffolding-inicial` o `Scaffolding-kit-agentes`. Mostrarla y aceptar la que proponga el usuario.
3. **Nombre**: `git config user.name` con espacios → guiones y sin acentos ("Diego Ramírez" → `Diego-Ramirez`). Si está vacío o es una sola palabra, avisar que la convención espera nombre y apellido y sugerir `git config --global user.name "Nombre Apellido"`; no cambiarlo sin que el usuario lo pida.
4. **Branch**: `[<tipo>/]CU-<id>_<Descripcion>_<Nombre-Apellido>`. El ID va con el prefijo `CU-` tal como lo muestra ClickUp. Mostrar el nombre final antes de crear nada.
5. **Crear el branch** desde el branch por defecto real, actualizado:
   ```bash
   DEF=$(git symbolic-ref --short refs/remotes/origin/HEAD | sed 's#^origin/##')
   git status --short          # si hay cambios sin commitear, preguntar qué hacer antes de seguir
   git fetch origin "$DEF"
   git switch -c "<branch>" "origin/$DEF"
   ```
   No asumir `main`: algunos repos usan `develop` (p. ej. `FrontFeatures-Corporate`).
6. **Mover la tarea a `in progress`**: proponer el commit vacío y el push. **No hacerlo sin confirmación**, porque el push cambia el estado de la tarea en ClickUp y lo ve todo el equipo:
   ```bash
   git commit --allow-empty -m "CU-<id>[in progress]"
   git push -u origin "<branch>"
   ```

## Estados desde commits

`CU-<id>[<estado>]` en cualquier mensaje de commit cambia el estado de la tarea cuando el commit llega a GitHub. Sin espacio entre el ID y el corchete, y con un estado que exista en ClickUp (lista en `workflow.md`). Momentos habituales:
- `in progress`: al empezar (paso 6).
- `qa testing`: cuando `/norkut-core:dod-check` da "lista para qa testing".
- `completed` y `Closed`: los mueven QA y el Arquitecto según la tabla de transiciones.

El hook `branch-guard` avisa si un branch no sigue el formato o si un commit usa un estado que no existe.
