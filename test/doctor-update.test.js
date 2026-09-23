import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { init, requiredEnvVars } from '../src/init.js';
import { sync } from '../src/sync.js';
import { doctor } from '../src/doctor.js';
import { update } from '../src/update.js';

const FAKE = fileURLToPath(new URL('../test-fixtures/fake-claude.js', import.meta.url));
const KIT = fileURLToPath(new URL('..', import.meta.url));
const quiet = () => {};
let dir, env, repo;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nak-doctor-'));
  mkdirSync(join(dir, 'bin'));
  symlinkSync(FAKE, join(dir, 'bin/claude'));
  env = {
    PATH: `${join(dir, 'bin')}:${dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: dir,
    FAKE_CLAUDE_STATE: join(dir, 'state.json'),
    FAKE_CLAUDE_LOG: join(dir, 'calls.log'),
    ...Object.fromEntries(requiredEnvVars().map((v) => [v, 'x'])),
  };
  repo = join(dir, 'Module-X');
  mkdirSync(repo);
  spawnSync('git', ['init', '-q', repo]);
});

// Copia del kit con otra versión en todos sus plugins, para simular un kit nuevo.
function kitWithVersion(version) {
  const kit = join(dir, 'kit');
  cpSync(KIT, kit, { recursive: true, filter: (s) => !s.includes('node_modules') && !s.includes('.git') });
  for (const name of readdirSync(join(kit, 'plugins'))) {
    const p = join(kit, 'plugins', name, '.claude-plugin/plugin.json');
    writeFileSync(p, JSON.stringify({ ...JSON.parse(readFileSync(p, 'utf8')), version }));
  }
  return kit;
}

test('doctor sin problemas después de init y sync', () => {
  init({ role: 'pm', env, log: quiet });
  sync({ cwd: repo, log: quiet });
  assert.deepEqual(doctor({ cwd: repo, env, mcp: false, log: quiet }).problems, []);
});

test('doctor reporta drift si se edita a mano un .claude/rules', () => {
  init({ role: 'pm', env, log: quiet });
  sync({ cwd: repo, log: quiet });
  writeFileSync(join(repo, '.claude/rules/mongo-repositories.md'), 'editado a mano\n');
  const { problems } = doctor({ cwd: repo, env, mcp: false, log: quiet });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\.claude\/rules\/mongo-repositories\.md \(difiere\)/);
});

test('doctor reporta drift si la memoria del kit cambió y .agent/shared quedó vieja', () => {
  init({ role: 'pm', env, log: quiet });
  sync({ cwd: repo, log: quiet });
  writeFileSync(join(repo, '.agent/shared/gotchas.md'), 'vieja\n');
  assert.match(doctor({ cwd: repo, env, mcp: false, log: quiet }).problems[0], /\.agent\/shared\/gotchas\.md \(difiere\)/);
});

test('doctor reporta env vars faltantes y MCPs caídos', () => {
  init({ role: 'pm', env, log: quiet });
  env.FAKE_CLAUDE_MCP = 'plugin:norkut-core:clickup: https://mcp.clickup.com/mcp (HTTP) - ✘ Failed to connect — HTTP 401\nplugin:norkut-core:github: npx x - ✔ Connected';
  delete env.GITHUB_TOKEN;
  const { problems } = doctor({ cwd: dir, env, log: quiet });
  assert.deepEqual(problems, ['MCP plugin:norkut-core:clickup: Failed to connect', 'Faltan env vars: GITHUB_TOKEN']);
});

test('doctor reporta norkut-core no instalado', () => {
  const { problems } = doctor({ cwd: dir, env, mcp: false, log: quiet });
  assert.ok(problems.some((p) => /Marketplace norkut no configurado/.test(p)));
  assert.ok(problems.some((p) => /norkut-core@norkut no instalado/.test(p)));
});

test('update sube de versión y doctor lo refleja', () => {
  init({ role: 'pm', env, log: quiet });
  const kit = kitWithVersion('0.2.0');
  assert.match(doctor({ cwd: dir, env, kitRoot: kit, mcp: false, log: quiet }).problems[0], /0\.1\.0 instalado, el kit pinea 0\.2\.0/);
  env.FAKE_CLAUDE_MARKET_VERSION = '0.2.0';
  const res = update({ env, kitRoot: kit, log: quiet });
  assert.deepEqual(res, { updated: ['norkut-core@norkut', 'norkut-pm@norkut'], behind: [] });
  assert.deepEqual(doctor({ cwd: dir, env, kitRoot: kit, mcp: false, log: quiet }).problems, []);
});

test('update avisa si el marketplace no entrega la versión que pinea el kit', () => {
  init({ role: 'pm', env, log: quiet });
  const res = update({ env, kitRoot: kitWithVersion('0.3.0'), log: quiet });
  assert.deepEqual(res.behind, ['norkut-core@norkut: instalado 0.1.0, el kit pinea 0.3.0', 'norkut-pm@norkut: instalado 0.1.0, el kit pinea 0.3.0']);
});

test('update falla si no se corrió init', () => {
  assert.throws(() => update({ env, log: quiet }), /Correr `init` primero/);
});
