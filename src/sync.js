import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { KIT_ROOT } from './init.js';

// Marca de los archivos que genera sync. Va después del frontmatter para no romperlo.
export const GENERATED_MARK = 'generado por norkut-agent-kit — editar .agent/rules/';
const HEADER = `<!-- ${GENERATED_MARK} -->`;
const SHARED_HEADER = '<!-- generado por norkut-agent-kit — copia de la memoria del plugin norkut-core; no editar -->';
const PENDING = '_completar_';

// Escribe solo si el contenido cambia; devuelve true si escribió.
function writeIfChanged(path, content, changed) {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  changed.push(path);
  return true;
}

function listMd(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
}

// Frontmatter mínimo de las reglas: solo `paths:` como lista YAML de strings.
export function parseRule(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { paths: [], body: text };
  const paths = [...m[1].matchAll(/^\s*-\s*["']?([^"'\n]+?)["']?\s*$/gm)].map((x) => x[1]);
  return { paths, body: text.slice(m[0].length) };
}

export function toClaudeRule({ paths, body }) {
  const fm = paths.length ? `---\npaths:\n${paths.map((p) => `  - "${p}"`).join('\n')}\n---\n` : '';
  return `${fm}${HEADER}\n${body}`;
}

export function toCursorRule({ paths, body }) {
  const title = body.match(/^#\s+(.+)$/m)?.[1] ?? '';
  const fm = [
    '---',
    `description: ${title}`,
    paths.length ? `globs: ${paths.join(', ')}` : null,
    `alwaysApply: ${paths.length ? 'false' : 'true'}`,
    '---',
  ].filter((l) => l !== null);
  return `${fm.join('\n')}\n${HEADER}\n${body}`;
}

// Fila de memory/modules.md cuya primera columna es el repo.
export function moduleRow(modulesMd, repo) {
  const line = modulesMd.split('\n').find((l) => l.startsWith(`| ${repo} |`));
  if (!line) return null;
  const [, que, vertical, owner] = line.split('|').map((c) => c.trim()).filter(Boolean);
  const known = (v) => (v && !v.startsWith('_') ? v : PENDING);
  return { descripcion: known(que), verticales: known(vertical), owner: known(owner) };
}

// Servicios .NET: carpetas de primer nivel con `<X>/<X>.API` o `<X>/<X>.Domain`.
export function detectServices(root) {
  return readdirSync(root)
    .filter((d) => !d.startsWith('.') && statSync(join(root, d)).isDirectory())
    .filter((d) => existsSync(join(root, d, `${d}.API`)) || existsSync(join(root, d, `${d}.Domain`)))
    .sort();
}

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? PENDING);
}

// Resumen para Cursor: el "Resumen" de MEMORY.md y la tabla de riesgos, con punteros a .agent/shared/.
export function contextRule(memoryDir) {
  const memory = readFileSync(join(memoryDir, 'MEMORY.md'), 'utf8');
  const resumen = memory.split(/^## Resumen.*$/m)[1]?.split(/^## /m)[0].trim() ?? '';
  const risks = readFileSync(join(memoryDir, 'risks.md'), 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.startsWith('| Riesgo') && !l.startsWith('|---'))
    .map((l) => `- ${l.split('|')[1].trim()}`);
  return [
    '---',
    'description: Contexto compartido de Norkut (módulos, contratos de eventos, riesgos, workflow)',
    'alwaysApply: true',
    '---',
    '<!-- generado por norkut-agent-kit — resumen de .agent/shared/; no editar -->',
    '# Contexto Norkut',
    '',
    resumen,
    '',
    '## Riesgos que siempre se evalúan',
    ...risks,
    '',
    'Detalle en `.agent/shared/`: `modules.md` (repos, owners, colecciones compartidas), `event-contracts.md`, `risks.md`, `workflow.md`, `gotchas.md`.',
    '',
  ].join('\n');
}

export function sync({ cwd = process.cwd(), kitRoot = KIT_ROOT, log = console.log } = {}) {
  if (!existsSync(join(cwd, '.git'))) throw new Error(`${cwd} no es la raíz de un repo git. Correr sync desde la raíz del repo.`);
  const changed = [];
  const repo = basename(cwd);
  const memoryDir = join(kitRoot, 'plugins/norkut-core/memory');
  const templates = join(kitRoot, 'templates');

  // 1. CLAUDE.md: solo si no existe.
  const claudeMd = join(cwd, 'CLAUDE.md');
  if (!existsSync(claudeMd)) {
    const row = moduleRow(readFileSync(join(memoryDir, 'modules.md'), 'utf8'), repo) ?? {};
    const services = detectServices(cwd);
    writeIfChanged(claudeMd, fill(readFileSync(join(templates, 'CLAUDE.md.template'), 'utf8'), {
      REPO: repo,
      DESCRIPCION: row.descripcion,
      VERTICALES: row.verticales,
      OWNER: row.owner,
      MODULES: services.length ? services.join(', ') : undefined,
    }), changed);
  }

  // 2. .agent/rules/: reglas base solo si la carpeta no existe (después es del repo).
  const rulesDir = join(cwd, '.agent/rules');
  if (!existsSync(rulesDir)) {
    for (const f of listMd(join(templates, 'rules'))) {
      writeIfChanged(join(rulesDir, f), readFileSync(join(templates, 'rules', f), 'utf8'), changed);
    }
  }

  // 3. .claude/rules/*.md y .cursor/rules/*.mdc generados desde .agent/rules/.
  const sources = listMd(rulesDir);
  const expected = new Set();
  for (const f of sources) {
    const rule = parseRule(readFileSync(join(rulesDir, f), 'utf8'));
    const name = f.replace(/\.md$/, '');
    const claudePath = join(cwd, '.claude/rules', `${name}.md`);
    const cursorPath = join(cwd, '.cursor/rules', `${name}.mdc`);
    expected.add(claudePath).add(cursorPath);
    writeIfChanged(claudePath, toClaudeRule(rule), changed);
    writeIfChanged(cursorPath, toCursorRule(rule), changed);
  }
  // Borrar generados cuya fuente ya no existe. Nunca toca archivos sin la marca.
  for (const [dir, ext] of [['.claude/rules', '.md'], ['.cursor/rules', '.mdc']]) {
    const abs = join(cwd, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs).filter((x) => x.endsWith(ext))) {
      const p = join(abs, f);
      if (!expected.has(p) && readFileSync(p, 'utf8').includes(GENERATED_MARK)) {
        rmSync(p);
        changed.push(`${p} (borrado)`);
      }
    }
  }

  // 4. Memoria cross-repo copiada a .agent/shared/ + resumen para Cursor.
  const copy = (src, dest) => {
    for (const f of readdirSync(src)) {
      const s = join(src, f);
      if (statSync(s).isDirectory()) copy(s, join(dest, f));
      else writeIfChanged(join(dest, f), `${SHARED_HEADER}\n${readFileSync(s, 'utf8')}`, changed);
    }
  };
  copy(memoryDir, join(cwd, '.agent/shared'));
  writeIfChanged(join(cwd, '.cursor/rules/00-norkut-context.mdc'), contextRule(memoryDir), changed);

  // 5. .agent/memory/MEMORY.md desde template si falta.
  const repoMemory = join(cwd, '.agent/memory/MEMORY.md');
  if (!existsSync(repoMemory)) {
    writeIfChanged(repoMemory, fill(readFileSync(join(templates, 'agent-memory/MEMORY.md'), 'utf8'), { REPO: repo }), changed);
  }

  // 6. .gitignore: agregar las líneas del snippet que falten.
  const gitignore = join(cwd, '.gitignore');
  const current = existsSync(gitignore) ? readFileSync(gitignore, 'utf8') : '';
  const have = new Set(current.split('\n').map((l) => l.trim()));
  const missing = readFileSync(join(templates, 'gitignore.snippet'), 'utf8').split('\n').filter((l) => l.trim() && !have.has(l.trim()));
  if (missing.length) {
    const sep = current && !current.endsWith('\n') ? '\n' : '';
    writeIfChanged(gitignore, `${current}${sep}${current ? '\n' : ''}${missing.join('\n')}\n`, changed);
  }

  const rel = (p) => p.replace(`${cwd}/`, '');
  if (changed.length) log(`Actualizados (${changed.length}):\n${changed.map((p) => `  ${rel(p)}`).join('\n')}`);
  else log('Sin cambios: el repo ya estaba sincronizado.');
  return { changed: changed.map(rel) };
}
