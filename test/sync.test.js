import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sync, parseRule, toClaudeRule, toCursorRule, moduleRow, detectStacks } from '../src/sync.js';

const CLI = fileURLToPath(new URL('../bin/cli.js', import.meta.url));
const quiet = () => {};
let repo;

const git = (...args) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });

beforeEach(() => {
  repo = join(mkdtempSync(join(tmpdir(), 'nak-sync-')), 'Module-POS');
  mkdirSync(join(repo, 'PointOfSale/PointOfSale.API'), { recursive: true });
  mkdirSync(join(repo, 'StoreOperation/StoreOperation.Domain'), { recursive: true });
  git('init', '-q');
});

const read = (p) => readFileSync(join(repo, p), 'utf8');

test('crea CLAUDE.md desde el template con datos de modules.md y servicios detectados', () => {
  sync({ cwd: repo, log: quiet });
  const md = read('CLAUDE.md');
  assert.match(md, /^# Module-POS/);
  assert.match(md, /Point of Sale/);
  assert.match(md, /Módulos: PointOfSale, StoreOperation/);
  assert.doesNotMatch(md, /\{\{\w+\}\}/);
});

test('nunca pisa un CLAUDE.md existente', () => {
  writeFileSync(join(repo, 'CLAUDE.md'), 'mío\n');
  sync({ cwd: repo, log: quiet });
  assert.equal(read('CLAUDE.md'), 'mío\n');
});

test('genera reglas de Claude y Cursor desde .agent/rules', () => {
  sync({ cwd: repo, log: quiet });
  const claude = read('.claude/rules/mongo-repositories.md');
  assert.match(claude, /^---\npaths:\n  - "\*\*\/\*Repository\*\.cs"/);
  assert.match(claude, /generado por norkut-agent-kit/);
  const cursor = read('.cursor/rules/mongo-repositories.mdc');
  assert.match(cursor, /^---\ndescription: Repositorios y acceso a Mongo\nglobs: \*\*\/\*Repository\*\.cs, \*\*\/Persistence\/\*\*\/\*\.cs\nalwaysApply: false\n---/);
  assert.match(read('.cursor/rules/00-norkut-context.mdc'), /alwaysApply: true/);
  assert.ok(existsSync(join(repo, '.agent/shared/modules.md')));
  assert.ok(existsSync(join(repo, '.agent/shared/decisions/README.md')));
  assert.match(read('.agent/memory/MEMORY.md'), /^# Memoria — Module-POS/);
});

test('idempotente: git status queda limpio en un repo ya sincronizado', () => {
  sync({ cwd: repo, log: quiet });
  git('add', '-A');
  git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'sync');
  const second = sync({ cwd: repo, log: quiet });
  assert.deepEqual(second.changed, []);
  assert.equal(git('status', '--porcelain').stdout, '');
});

test('.agent/shared queda gitignored y el .gitignore existente se respeta', () => {
  writeFileSync(join(repo, '.gitignore'), 'bin/\nobj/');
  sync({ cwd: repo, log: quiet });
  assert.equal(read('.gitignore'), 'bin/\nobj/\n\n# norkut-agent-kit\nCLAUDE.local.md\n.agent/shared/\n');
  assert.equal(git('check-ignore', '.agent/shared/modules.md').status, 0);
});

test('regenera un generado editado a mano y borra los huérfanos, sin tocar reglas propias', () => {
  sync({ cwd: repo, log: quiet });
  writeFileSync(join(repo, '.claude/rules/mongo-repositories.md'), 'editado a mano\n');
  writeFileSync(join(repo, '.claude/rules/propia.md'), '# regla propia del repo\n');
  rmSync(join(repo, '.agent/rules/integration-events.md'));
  const { changed } = sync({ cwd: repo, log: quiet });
  assert.match(read('.claude/rules/mongo-repositories.md'), /generado por norkut-agent-kit/);
  assert.ok(!existsSync(join(repo, '.claude/rules/integration-events.md')));
  assert.ok(!existsSync(join(repo, '.cursor/rules/integration-events.mdc')));
  assert.equal(read('.claude/rules/propia.md'), '# regla propia del repo\n');
  assert.ok(changed.includes('.claude/rules/integration-events.md (borrado)'));
});

test('no recrea .agent/rules si el repo borró una regla base', () => {
  sync({ cwd: repo, log: quiet });
  rmSync(join(repo, '.agent/rules/integration-events.md'));
  sync({ cwd: repo, log: quiet });
  assert.ok(!existsSync(join(repo, '.agent/rules/integration-events.md')));
});

test('regla sin paths: siempre aplica en Cursor y sin frontmatter en Claude', () => {
  const rule = parseRule('# General\n- algo\n');
  assert.equal(toClaudeRule(rule).startsWith('<!--'), true);
  assert.match(toCursorRule(rule), /alwaysApply: true/);
  assert.doesNotMatch(toCursorRule(rule), /globs:/);
});

test('moduleRow devuelve _completar_ para datos por definir', () => {
  const row = moduleRow('| Module-X | Algo | _por definir_ | _por definir_ | — |', 'Module-X');
  assert.deepEqual(row, { descripcion: 'Algo', verticales: '_completar_', owner: '_completar_' });
  assert.equal(moduleRow('', 'Module-X'), null);
});

test('falla fuera de la raíz de un repo git', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nak-nogit-'));
  assert.throws(() => sync({ cwd: dir, log: quiet }), /no es la raíz de un repo git/);
});

test('CLI: sync dos veces, la segunda sin cambios', () => {
  const run = () => spawnSync(process.execPath, [CLI, 'sync'], { cwd: repo, encoding: 'utf8' });
  assert.equal(run().status, 0);
  const second = run();
  assert.equal(second.status, 0);
  assert.match(second.stdout, /Sin cambios/);
});

// Repo git temporal con los archivos indicados.
function repoWith(files) {
  const dir = join(mkdtempSync(join(tmpdir(), 'nak-stack-')), 'Repo');
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(join(dir, p, '..'), { recursive: true });
    writeFileSync(join(dir, p), c);
  }
  spawnSync('git', ['init', '-q', dir]);
  return dir;
}
const seeded = (dir) => readdirSync(join(dir, '.agent/rules')).sort();

test('siembra solo las reglas base del stack del repo', () => {
  assert.deepEqual(seeded((sync({ cwd: repo, log: quiet }), repo)), ['integration-events.md', 'mongo-repositories.md']);
  const ng = repoWith({ 'angular.json': '{}', 'package.json': '{"dependencies":{"@angular/core":"^19"}}' });
  sync({ cwd: ng, log: quiet });
  assert.deepEqual(seeded(ng), ['angular-features.md']);
  const py = repoWith({ 'svc_a/requirements.txt': 'pymongo' });
  sync({ cwd: py, log: quiet });
  assert.deepEqual(seeded(py), ['python-services.md']);
});

test('sin stack detectado siembra todas las reglas base', () => {
  const unknown = repoWith({ 'README.md': 'x' });
  assert.deepEqual(detectStacks(unknown), []);
  sync({ cwd: unknown, log: quiet });
  assert.equal(seeded(unknown).length, 4);
});

test('stacks: no pasa a las reglas generadas', () => {
  sync({ cwd: repo, log: quiet });
  assert.doesNotMatch(read('.claude/rules/mongo-repositories.md'), /stacks:/);
  assert.doesNotMatch(read('.cursor/rules/mongo-repositories.mdc'), /stacks:/);
  assert.deepEqual(parseRule('---\nstacks: [dotnet, python]\n---\n# x\n').stacks, ['dotnet', 'python']);
});

test('Cursor recibe CLAUDE.md y la memoria del repo por referencia', () => {
  sync({ cwd: repo, log: quiet });
  const rule = read('.cursor/rules/01-repo-instructions.mdc');
  assert.match(rule, /^---\ndescription: .+\nalwaysApply: true\n---/);
  assert.match(rule, /@CLAUDE\.md/);
  assert.match(rule, /@\.agent\/memory\/MEMORY\.md/);
});
