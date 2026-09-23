import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { init, requiredEnvVars } from '../src/init.js';

const FAKE = fileURLToPath(new URL('../test-fixtures/fake-claude.js', import.meta.url));
const CLI = fileURLToPath(new URL('../bin/cli.js', import.meta.url));
const quiet = () => {};
let dir, env;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nak-init-'));
  const bin = join(dir, 'bin');
  spawnSync('mkdir', [bin]);
  symlinkSync(FAKE, join(bin, 'claude'));
  env = {
    PATH: `${bin}:${dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: dir,
    FAKE_CLAUDE_STATE: join(dir, 'state.json'),
    FAKE_CLAUDE_LOG: join(dir, 'calls.log'),
  };
});

const calls = () => readFileSync(env.FAKE_CLAUDE_LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const mutating = (list) => list.filter((a) => a.includes('add') || a.includes('install'));

test('máquina limpia: agrega el marketplace e instala norkut-core', () => {
  const report = init({ role: 'backend', env, log: quiet });
  assert.deepEqual(report.changed, ['marketplace norkut (NorkutArg/norkut-agent-kit)', 'norkut-core@norkut']);
  assert.ok(calls().some((a) => a.join(' ') === 'plugin install norkut-core@norkut --scope user'));
});

test('idempotente: la segunda corrida no agrega ni instala nada', () => {
  init({ role: 'backend', env, log: quiet });
  writeFileSync(env.FAKE_CLAUDE_LOG, '');
  const report = init({ role: 'backend', env, log: quiet });
  assert.deepEqual(report.changed, []);
  assert.deepEqual(mutating(calls()), []);
});

test('no reinstala lo que ya está configurado', () => {
  writeFileSync(env.FAKE_CLAUDE_STATE, JSON.stringify({ marketplaces: ['norkut'], plugins: ['norkut-core@norkut'] }));
  const report = init({ role: 'pm', env, log: quiet });
  assert.deepEqual(report.changed, []);
  assert.deepEqual(mutating(calls()), []);
});

test('--source se usa para agregar el marketplace', () => {
  init({ role: 'pm', source: './', env, log: quiet });
  assert.ok(calls().some((a) => a.join(' ') === 'plugin marketplace add ./'));
});

test('avisa si el plugin del rol todavía no existe en el marketplace', () => {
  const report = init({ role: 'frontend', env, log: quiet });
  assert.ok(report.warnings.some((w) => w.startsWith('norkut-frontend todavía no existe')));
});

test('reporta env vars faltantes solo por nombre', () => {
  const vars = requiredEnvVars();
  assert.ok(vars.length > 0);
  assert.deepEqual(init({ role: 'pm', env, log: quiet }).missingEnv, vars);
  const withVars = { ...env, ...Object.fromEntries(vars.map((v) => [v, 'x'])) };
  assert.deepEqual(init({ role: 'pm', env: withVars, log: quiet }).missingEnv, []);
});

test('falla con mensaje claro si Claude Code no está instalado', () => {
  env.PATH = `${dirname(process.execPath)}:/usr/bin:/bin`;
  assert.throws(() => init({ role: 'pm', env, log: quiet }), /Claude Code no está instalado/);
});

test('CLI: segunda corrida de init informa "Sin cambios"', () => {
  const run = () => spawnSync(process.execPath, [CLI, 'init', '--role', 'pm'], { encoding: 'utf8', env });
  assert.equal(run().status, 0);
  const second = run();
  assert.equal(second.status, 0);
  assert.match(second.stdout, /Sin cambios/);
});
