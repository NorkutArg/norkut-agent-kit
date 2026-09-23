// Convenciones del kit (CLAUDE.md): se verifican acá para no depender de la revisión manual.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = fileURLToPath(new URL('..', import.meta.url));
const read = (...p) => readFileSync(join(KIT, ...p), 'utf8');
const plugins = readdirSync(join(KIT, 'plugins'));

function walk(dir, pred, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, pred, acc);
    else if (pred(p)) acc.push(p);
  }
  return acc;
}

test('cada plugin del marketplace existe y tiene plugin.json con el mismo nombre', () => {
  const mp = JSON.parse(read('.claude-plugin/marketplace.json'));
  assert.deepEqual(mp.plugins.map((p) => p.name).sort(), [...plugins].sort());
  for (const { name, source } of mp.plugins) {
    assert.equal(source, `./plugins/${name}`);
    assert.equal(JSON.parse(read('plugins', name, '.claude-plugin/plugin.json')).name, name);
  }
});

test('SKILL.md: frontmatter con name igual a la carpeta y description, < 300 líneas', () => {
  for (const plugin of plugins) {
    const dir = join(KIT, 'plugins', plugin, 'skills');
    if (!existsSync(dir)) continue;
    for (const skill of readdirSync(dir)) {
      const text = readFileSync(join(dir, skill, 'SKILL.md'), 'utf8');
      const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
      assert.ok(fm, `${plugin}/${skill}: sin frontmatter`);
      assert.match(fm[1], new RegExp(`^name: ${skill}$`, 'm'), `${plugin}/${skill}: name distinto de la carpeta`);
      assert.match(fm[1], /^description: .{40,}/m, `${plugin}/${skill}: description vacía o corta`);
      assert.ok(text.split('\n').length < 300, `${plugin}/${skill}: 300 líneas o más`);
    }
  }
});

test('las rutas ${CLAUDE_PLUGIN_ROOT}/... de los skills existen en su plugin', () => {
  for (const plugin of plugins) {
    for (const file of walk(join(KIT, 'plugins', plugin), (p) => p.endsWith('SKILL.md'))) {
      for (const [, rel] of readFileSync(file, 'utf8').matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+[\w/])/g)) {
        assert.ok(existsSync(join(KIT, 'plugins', plugin, rel)), `${file}: no existe ${rel}`);
      }
    }
  }
});

test('las referencias /plugin:skill apuntan a skills que existen', () => {
  const files = [...walk(join(KIT, 'plugins'), (p) => /\.(md|mjs)$/.test(p)), ...walk(join(KIT, 'templates'), () => true), join(KIT, 'README.md')];
  for (const file of files) {
    for (const [, plugin, skill] of readFileSync(file, 'utf8').matchAll(/\/(norkut-[a-z]+):([a-z-]+)/g)) {
      assert.ok(existsSync(join(KIT, 'plugins', plugin, 'skills', skill, 'SKILL.md')), `${file}: /${plugin}:${skill} no existe`);
    }
  }
});

test('hooks.json solo referencia scripts que existen', () => {
  for (const plugin of plugins) {
    const p = join(KIT, 'plugins', plugin, 'hooks/hooks.json');
    if (!existsSync(p)) continue;
    for (const [, rel] of readFileSync(p, 'utf8').matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+)/g)) {
      assert.ok(existsSync(join(KIT, 'plugins', plugin, rel)), `${plugin}: hook ${rel} no existe`);
    }
  }
});

test('memoria: MEMORY.md < 150 líneas y cada viñeta con fecha y origen', () => {
  const dir = join(KIT, 'plugins/norkut-core/memory');
  assert.ok(read('plugins/norkut-core/memory/MEMORY.md').split('\n').length < 150);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    for (const line of readFileSync(join(dir, file), 'utf8').split('\n').filter((l) => l.startsWith('- '))) {
      assert.match(line, /^- \d{4}-\d{2} · [^·]+ · \S/, `${file}: viñeta sin "AAAA-MM · origen · ": ${line.slice(0, 60)}`);
    }
  }
});

test('ningún archivo del kit contiene credenciales', () => {
  const patterns = [/mongodb(\+srv)?:\/\/[^:\s/@]+:[^@\s]+@/, /\bghp_[A-Za-z0-9]{36}\b/, /\bAKIA[0-9A-Z]{16}\b/, /_password=[A-Za-z0-9+/=]{8,}/];
  // Los tests y el hook que define los patrones pueden nombrarlos; el resto del kit no.
  const skip = ['/test/', '/node_modules/', '/.git/', 'secret-guard.mjs'];
  for (const file of walk(KIT, (p) => !skip.some((s) => p.includes(s)) && /\.(md|mjs|js|json|template|snippet|example)$/.test(p))) {
    // `user:pass@` es el ejemplo ficticio del criterio de aceptación de T0.9 (PLAN.md).
    const text = readFileSync(file, 'utf8').replaceAll('user:pass@', '');
    for (const re of patterns) assert.doesNotMatch(text, re, `${file} matchea ${re}`);
  }
});
