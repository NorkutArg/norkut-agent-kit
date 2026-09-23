# Fuente: dailies transcriptas por Tactiq

## Dónde están
- Google Drive, carpeta `Norkut Tactiq Sum/procesados` (Drive del PM). Acceso con el conector de Google Drive de claude.ai; el plugin no trae credenciales de Drive.
- Encontrar la carpeta: `search_files` con `title = 'procesados' and mimeType = 'application/vnd.google-apps.folder'` y quedarse con la que tiene como padre a `Norkut Tactiq Sum`. Si el usuario pasa un ID o link de carpeta, usar ese.
- Listar las dailies de un período: `search_files` con `parentId = '<id de procesados>' and createdTime >= '<desde>' and createdTime < '<hasta>'`, `excludeContentSnippets: true`. Paginar con `pageToken` hasta agotar.

## Cómo son los archivos
- Un Google Doc por reunión. El **título se repite todos los días** (`Daily POS`, `Daily Evolutivo`…): la fecha sale de `createdTime` o del encabezado del documento, nunca del título.
- Encabezado: `## <día> <mes> <año> | Daily <vertical>`, después `**Attendees:**`, una sección `# Highlights` (casi siempre vacía) y `# Transcript` con líneas `**mm:ss Nombre:** texto`.
- Reuniones que no son dailies de vertical (p. ej. `Meeting Transcription`): incluirlas solo si el usuario lo pide o si tratan riesgos del proyecto.

## Daily → vertical de ClickUp (Space "Producto Norkut")
| Título | Vertical(es) |
|---|---|
| Daily POS | POS |
| Daily Manejo de Lotes/Bridge | Manejo Lotes, Bridge |
| Daily Evolutivo | Evolutivo |
| Daily Corporativo | Corporativo |
| Daily Reposicion Inteligente | Reposición Inteligente |
| Daily Club/Fidelizacion | Fidelización |

No hay daily propia de Integraciones: si aparece en otra daily, atribuirla igual a Integraciones. Si aparece un título nuevo, agregarlo a esta tabla.

## Qué extraer de cada transcript
- **Avances**: qué se terminó o se desbloqueó.
- **Bloqueos y riesgos**: incidentes, dependencias de otra vertical o de terceros, fechas en riesgo, gente no disponible, retrabajo. Cruzar con los riesgos conocidos (skill `norkut-core:norkut-context` → `risks.md`): multitenant, contratos de eventos, colecciones compartidas, consistencia eventual.
- **Decisiones** tomadas y **pendientes** con responsable.
- **Ausencias de señal**: daily cancelada, sin avances, o que solo trató otro tema (p. ej. un incidente) también es información.

## Reglas
- Solo lo que dice el transcript; no completar con suposiciones. Si algo es ambiguo, marcarlo "a confirmar".
- Citar la fuente de cada highlight: vertical + fecha, con el link `viewUrl` del doc.
- No copiar frases textuales largas ni comentarios personales: resumir el hecho.
- Leer con `read_file_content` solo los docs del período pedido; son transcripciones completas y consumen contexto.
