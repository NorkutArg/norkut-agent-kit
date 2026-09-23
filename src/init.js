import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { claude, claudeJson } from './claude.js';

export const KIT_ROOT = new URL('..', import.meta.url).pathname;
export const KIT_REPO = 'NorkutArg/norkut-agent-kit';
export const ROLES = ['backend', 'frontend', 'pm'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// El kit pinea el marketplace al tag de su propia versión: todos los devs con la misma versión del CLI
// tienen los mismos plugins. El workflow de release crea el tag `v<versión>` al publicar.
export function pinnedSource(kitRoot = KIT_ROOT) {
  return `${KIT_REPO}@v${readJson(join(kitRoot, 'package.json')).version}`;
}

// Nombres de env vars referenciadas como ${VAR} en el .mcp.json de norkut-core.
export function requiredEnvVars(kitRoot = KIT_ROOT) {
  const raw = readFileSync(join(kitRoot, 'plugins/norkut-core/.mcp.json'), 'utf8');
  return [...new Set([...raw.matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1]))].sort();
}

function cursorInstalled(env) {
  if (spawnSync('cursor', ['--version'], { env }).status === 0) return true;
  return process.platform === 'darwin' && existsSync('/Applications/Cursor.app');
}

export function init({ role, source, env = process.env, kitRoot = KIT_ROOT, log = console.log }) {
  source ??= pinnedSource(kitRoot);
  if (!ROLES.includes(role)) throw new Error(`--role inválido: "${role}". Opciones: ${ROLES.join(', ')}`);
  const report = { changed: [], warnings: [], missingEnv: [] };

  const version = claude(['--version'], { env });
  if (version.missing || !version.ok) {
    throw new Error('Claude Code no está instalado o no responde (`claude --version`). Instalarlo y volver a correr init.');
  }
  log(`✔ ${version.stdout.trim()}`);

  if (cursorInstalled(env)) log('✔ Cursor instalado');
  else report.warnings.push('Cursor no detectado: las reglas para Cursor las genera `sync` igual, pero no se van a usar.');

  const marketplace = readJson(join(kitRoot, '.claude-plugin/marketplace.json'));
  const mpName = marketplace.name;
  const configured = claudeJson(['plugin', 'marketplace', 'list'], { env });
  if (configured.some((m) => m.name === mpName)) {
    log(`✔ Marketplace ${mpName} ya configurado`);
  } else {
    const res = claude(['plugin', 'marketplace', 'add', source], { env });
    if (!res.ok) throw new Error(`No se pudo agregar el marketplace ${source}: ${res.stderr.trim()}`);
    report.changed.push(`marketplace ${mpName} (${source})`);
    log(`✔ Marketplace ${mpName} agregado desde ${source}`);
  }

  const published = new Set(marketplace.plugins.map((p) => p.name));
  const wanted = ['norkut-core', `norkut-${role}`];
  const installed = new Set(claudeJson(['plugin', 'list'], { env }).map((p) => p.id));
  for (const name of wanted) {
    const id = `${name}@${mpName}`;
    if (!published.has(name)) {
      report.warnings.push(`${name} todavía no existe en el marketplace; se instala cuando se publique (\`init\` de nuevo).`);
      continue;
    }
    if (installed.has(id)) {
      log(`✔ ${id} ya instalado`);
      continue;
    }
    const res = claude(['plugin', 'install', id, '--scope', 'user'], { env });
    if (!res.ok) throw new Error(`No se pudo instalar ${id}: ${res.stderr.trim()}`);
    report.changed.push(id);
    log(`✔ ${id} instalado`);
  }

  report.missingEnv = requiredEnvVars(kitRoot).filter((v) => !env[v]);

  for (const w of report.warnings) log(`⚠ ${w}`);
  if (report.missingEnv.length) {
    log(`⚠ Faltan env vars para los MCPs de norkut-core: ${report.missingEnv.join(', ')}. Exportarlas en el perfil del shell.`);
  }
  log(report.changed.length ? `Cambios: ${report.changed.join(', ')}` : 'Sin cambios: todo estaba configurado.');
  return report;
}
