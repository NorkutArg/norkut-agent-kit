import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
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

  // Sin el registry del scope, `npx @norkutarg/agent-kit` no encuentra el paquete (GitHub Packages).
  const npmRegistry = spawnSync('npm', ['config', 'get', '@norkutarg:registry'], { env, encoding: 'utf8' });
  if (npmRegistry.status === 0) {
    if (npmRegistry.stdout.trim() === 'https://npm.pkg.github.com') ok('npm: @norkutarg apunta a GitHub Packages');
    else bad('npm: falta `@norkutarg:registry=https://npm.pkg.github.com` en ~/.npmrc (ver README). Sin eso no se puede actualizar el kit.');
  }

  // El nombre del branch lleva `git config user.name` (Nombre-Apellido): memory/workflow.md.
  const gitName = spawnSync('git', ['-C', cwd, 'config', 'user.name'], { env, encoding: 'utf8' }).stdout?.trim() ?? '';
  if (gitName.split(/\s+/).filter(Boolean).length >= 2) ok(`git user.name: ${gitName}`);
  else bad(`git user.name es "${gitName}": la convención de branches usa nombre y apellido (\`git config --global user.name "Nombre Apellido"\`).`);

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
