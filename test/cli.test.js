import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../bin/cli.js', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

test('--help lista init, sync, doctor y update', () => {
  const { status, stdout } = run('--help');
  assert.equal(status, 0);
  for (const cmd of ['init', 'sync', 'doctor', 'update']) {
    assert.match(stdout, new RegExp(`^\\s+${cmd}\\b`, 'm'));
  }
});

test('--version coincide con package.json', async () => {
  const { default: pkg } = await import('../package.json', { with: { type: 'json' } });
  assert.equal(run('--version').stdout.trim(), pkg.version);
});

test('init rechaza un rol inválido', () => {
  const { status, stderr } = run('init', '--role', 'qa');
  assert.notEqual(status, 0);
  assert.match(stderr, /--role inválido/);
});
