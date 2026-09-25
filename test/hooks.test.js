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

const bash = (command, cwd) => hook('branch-guard', 'Bash', { command }, cwd).out;

test('branch-guard acepta CU-<id>_<descripcion>_<Nombre-Apellido>, con o sin prefijo', () => {
  for (const b of ['CU-86e3cxn84_Scafolding-inicial_Diego-Ramirez', 'feat/CU-86e3cxn84_Scafolding-inicial_Diego-Ramirez', 'CU-abc123_Prueba_Diego']) {
    assert.equal(bash(`git checkout -b ${b}`), null, b);
  }
  assert.equal(bash('git switch -c fix/CU-abc123_Arreglo-login_Ana-Perez'), null);
});

test('branch-guard avisa si el branch no sigue el formato, con una sugerencia armada con git config user.name', () => {
  spawnSync('git', ['-C', norkut, 'config', 'user.name', 'Diego Ramírez']);
  for (const b of ['feature/sin-id', 'feature/CU-86abc123-sync-stock', 'CU-86abc123_sin-usuario']) {
    const out = bash(`git checkout -b ${b}`);
    assert.match(out.systemMessage, /no sigue el formato/, b);
    assert.equal(out.hookSpecificOutput.additionalContext, out.systemMessage);
  }
  assert.match(bash('git checkout -b feature/CU-86abc123-sync-stock').systemMessage, /`CU-86abc123_<descripcion-corta>_Diego-Ramirez`/);
  assert.match(bash('git branch otra-cosa').systemMessage, /otra-cosa/);
});

test('branch-guard no avisa en otros comandos, en memory/*, ni fuera de NorkutArg', () => {
  assert.equal(bash('git status'), null);
  assert.equal(bash('git branch -d viejo'), null);
  assert.equal(bash('git checkout -b memory/gotcha-hangfire'), null);
  assert.equal(bash('git checkout -b feature/sin-id', other), null);
});

test('branch-guard revisa el branch actual en git push y omite main', () => {
  spawnSync('git', ['-C', norkut, 'checkout', '-q', '-b', 'fix/sin-id']);
  assert.match(bash('git push -u origin HEAD').systemMessage, /fix\/sin-id/);
  spawnSync('git', ['-C', norkut, 'checkout', '-q', '-b', 'main']);
  assert.equal(bash('git push'), null);
});

test('branch-guard valida el estado de ClickUp en los mensajes de commit', () => {
  assert.equal(bash('git commit --allow-empty -m "CU-86e3cxn84[COMPLETED]"'), null);
  assert.equal(bash('git commit -m "CU-86e3cxn84[in progress] arranca la tarea"'), null);
  assert.equal(bash('git commit -m "sin tarea"'), null);
  assert.match(bash('git commit -m "CU-86e3cxn84[terminado]"').systemMessage, /"terminado" no es un estado de ClickUp/);
  assert.match(bash('git commit -m "CU-86e3cxn84 [completed]"').systemMessage, /espacio entre el ID y el corchete/);
  // Con opciones globales de git antes del subcomando (caso real encontrado en una sesión).
  assert.match(bash('git -c user.email=t@t commit --allow-empty -m "CU-abc123[inexistente]"').systemMessage, /"inexistente" no es un estado/);
  assert.match(bash(`git -C ${norkut} checkout -b sin-formato`).systemMessage, /sin-formato/);
  assert.match(bash('git --no-pager branch otra-cosa').systemMessage, /otra-cosa/);
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
