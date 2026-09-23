import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { claude, claudeJson } from './claude.js';
import { KIT_ROOT, requiredEnvVars } from './init.js';
import { kitInfo } from './kit.js';
import { generatedFiles } from './sync.js';

// Estado de la máquina y, si cwd es un repo sincronizado, drift de los generados.
export function doctor({ cwd = process.cwd(), env = process.env, kitRoot = KIT_ROOT, mcp = true, log = console.log } = {}) {
  const problems = [];
  const ok = (m) => log(`✔ ${m}`);
  const bad = (m) => {
    problems.push(m);
    log(`✘ ${m}`);
  };

  const kit = kitInfo(kitRoot);
  log(`norkut-agent-kit ${kit.version}`);

  const version = claude(['--version'], { env });
  if (version.missing || !version.ok) {
    bad('Claude Code no está instalado o no responde. Instalarlo y correr `init`.');
  } else {
    ok(version.stdout.trim());
    if (claudeJson(['plugin', 'marketplace', 'list'], { env }).some((m) => m.name === kit.marketplace)) ok(`Marketplace ${kit.marketplace} configurado`);
    else bad(`Marketplace ${kit.marketplace} no configurado. Correr \`init\`.`);

    const installed = new Map(claudeJson(['plugin', 'list'], { env }).map((p) => [p.id, p]));
    for (const [id, expected] of Object.entries(kit.plugins)) {
      const p = installed.get(id);
      if (!p) {
        if (id.startsWith('norkut-core@')) bad(`${id} no instalado. Correr \`init\`.`);
        continue;
      }
      if (p.version !== expected) bad(`${id} ${p.version} instalado, el kit pinea ${expected}. Correr \`update\`.`);
      else if (p.enabled === false) bad(`${id} ${p.version} instalado pero deshabilitado (\`claude plugin enable ${id}\`).`);
      else ok(`${id} ${p.version}`);
    }

    if (mcp) {
      const list = claude(['mcp', 'list'], { env });
      const lines = list.stdout.split('\n').filter((l) => l.startsWith('plugin:norkut-'));
      for (const l of lines) {
        const name = l.slice(0, l.indexOf(': '));
        if (l.includes('✔')) ok(`MCP ${name} conectado`);
        else bad(`MCP ${name}: ${l.slice(l.lastIndexOf(' - ') + 3).split(' — ')[0].replace(/^[✘!]\s*/, '')}`);
      }
    }
  }

  const missingEnv = requiredEnvVars(kitRoot).filter((v) => !env[v]);
  if (missingEnv.length) bad(`Faltan env vars: ${missingEnv.join(', ')}`);
  else ok('Env vars de los MCPs definidas');

  // Repo: solo si es la raíz de un repo que ya corrió sync.
  if (existsSync(join(cwd, '.git')) && existsSync(join(cwd, '.agent'))) {
    const rel = (p) => relative(cwd, p);
    for (const f of ['CLAUDE.md', '.agent/memory/MEMORY.md']) {
      if (!existsSync(join(cwd, f))) bad(`${f} no existe. Correr \`sync\`.`);
    }
    const { files, orphans } = generatedFiles(cwd, kitRoot);
    const drift = [...files]
      .filter(([p, content]) => !existsSync(p) || readFileSync(p, 'utf8') !== content)
      .map(([p]) => (existsSync(p) ? `${rel(p)} (difiere)` : `${rel(p)} (falta)`));
    drift.push(...orphans.map((p) => `${rel(p)} (huérfano)`));
    if (drift.length) bad(`Drift entre .agent/rules, la memoria del kit y los generados. Correr \`sync\`:\n    ${drift.join('\n    ')}`);
    else ok('Reglas generadas y .agent/shared al día');
  }

  log(problems.length ? `${problems.length} problema(s).` : 'Todo en orden.');
  return { problems };
}
