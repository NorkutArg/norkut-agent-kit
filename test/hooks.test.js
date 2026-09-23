import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOKS = fileURLToPath(new URL('../plugins/norkut-core/hooks/', import.meta.url));
let norkut, other;

// Un repo con remoto NorkutArg y otro sin, para verificar que los hooks solo actúan en el primero.
before(() => {
  const base = mkdtempSync(join(tmpdir(), 'nak-hooks-'));
  norkut = join(base, 'Module-X');
  other = join(base, 'otro');
  for (const [dir, remote] of [[norkut, 'git@github.com:NorkutArg/Module-X.git'], [other, 'git@github.com:alguien/otro.git']]) {
    mkdirSync(dir);
    spawnSync('git', ['init', '-q', dir]);
    spawnSync('git', ['-C', dir, 'remote', 'add', 'origin', remote]);
  }
});

function hook(name, toolName, toolInput, cwd = norkut) {
  const res = spawnSync(process.execPath, [join(HOOKS, `${name}.mjs`)], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: toolName, tool_input: toolInput, cwd }),
    encoding: 'utf8',
  });
  return { status: res.status, out: res.stdout ? JSON.parse(res.stdout) : null, stderr: res.stderr };
}
const write = (file, content) => ({ file_path: join(norkut, file), content });

test('secret-guard bloquea una connection string de Mongo con credenciales', () => {
  const r = hook('secret-guard', 'Write', write('appsettings.json', '{"Mongo":"mongodb+srv://user:pass@cluster0.x.net"}'));
  assert.equal(r.status, 2);
  assert.equal(r.out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(r.stderr, /connection string de Mongo/);
});

test('secret-guard bloquea tokens en Edit con edits[]', () => {
  const r = hook('secret-guard', 'Edit', { file_path: join(norkut, 'a.cs'), edits: [{ old_string: 'a', new_string: `var t = "ghp_${'a'.repeat(36)}";` }] });
  assert.equal(r.status, 2);
});

test('secret-guard deja pasar placeholders y texto sin credenciales', () => {
  for (const content of ['mongodb://localhost:27017', 'Server=db;Password=${DB_PASSWORD}', 'mongodb+srv://${USER}@cluster', 'hola']) {
    assert.equal(hook('secret-guard', 'Write', write('x.json', content)).status, 0, content);
  }
});

test('secret-guard no actúa fuera de repos NorkutArg', () => {
  const r = hook('secret-guard', 'Write', { file_path: join(other, 'x.json'), content: 'mongodb+srv://user:pass@c' }, other);
  assert.equal(r.status, 0);
});

test('secret-guard evalúa archivos nuevos en carpetas que todavía no existen', () => {
  assert.equal(hook('secret-guard', 'Write', write('nueva/carpeta/x.json', 'mongodb://u:p@h')).status, 2);
});

test('branch-guard avisa en git checkout -b sin ID de ClickUp', () => {
  const r = hook('branch-guard', 'Bash', { command: 'git checkout -b feature/sin-id' });
  assert.equal(r.status, 0);
  assert.match(r.out.systemMessage, /feature\/sin-id.*no tiene ID de ClickUp/);
  assert.equal(r.out.hookSpecificOutput.additionalContext, r.out.systemMessage);
});

test('branch-guard no avisa con ID, en otros comandos ni fuera de NorkutArg', () => {
  assert.equal(hook('branch-guard', 'Bash', { command: 'git switch -c feature/CU-86abc123-sync' }).out, null);
  assert.equal(hook('branch-guard', 'Bash', { command: 'git status' }).out, null);
  assert.equal(hook('branch-guard', 'Bash', { command: 'git checkout -b feature/sin-id' }, other).out, null);
});

test('branch-guard revisa el branch actual en git push y omite main', () => {
  spawnSync('git', ['-C', norkut, 'checkout', '-q', '-b', 'fix/sin-id']);
  assert.match(hook('branch-guard', 'Bash', { command: 'git push -u origin HEAD' }).out.systemMessage, /fix\/sin-id/);
  spawnSync('git', ['-C', norkut, 'checkout', '-q', '-b', 'main']);
  assert.equal(hook('branch-guard', 'Bash', { command: 'git push' }).out, null);
});

test('tenant-guard avisa en un DAO con query sin tenant', () => {
  const body = 'var q = new MongoDbQueryBuilder().InCollection(CollectionName).Where(x).Build();';
  const r = hook('tenant-guard', 'Write', write('Infra/Dao/CatalogDao.cs', body));
  assert.match(r.out.systemMessage, /tenant-guard: CatalogDao\.cs/);
});

test('tenant-guard no avisa con WithTenant, NonTenant ni en otros archivos', () => {
  const scoped = 'new MongoDbQueryBuilder().InCollection(C).WithTenant(id).Build();';
  assert.equal(hook('tenant-guard', 'Write', write('Dao/CatalogDao.cs', scoped)).out, null);
  assert.equal(hook('tenant-guard', 'Write', write('Dao/RoleDao.cs', 'new MongoDbQueryBuilder().NonTenant()')).out, null);
  assert.equal(hook('tenant-guard', 'Write', write('Api/Program.cs', 'new MongoDbQueryBuilder()')).out, null);
});

test('contract-guard avisa al tocar un record de IntegrationEvents', () => {
  const r = hook('contract-guard', 'Edit', { file_path: join(norkut, 'Svc.Domain/IntegrationEvents/Consumers/InvoiceEmitted/InvoiceEmittedConsumer.cs'), old_string: 'a', new_string: 'b' });
  assert.match(r.out.systemMessage, /contrato de `InvoiceEmitted`/);
  assert.equal(hook('contract-guard', 'Edit', { file_path: join(norkut, 'Svc.Domain/Stores/Store.cs'), old_string: 'a', new_string: 'b' }).out, null);
});
