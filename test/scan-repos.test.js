import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { scan, toMarkdown } from '../scripts/scan-repos.js';

// Árbol mínimo de repos con los casos reales que encontró el relevamiento.
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'nak-scan-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const EV = 'Svc.Domain/IntegrationEvents';
const repos = fixture({
  // Colección declarada en dos repos
  'Module-A/Svc/Svc.Infrastructure/Constants/Collections.cs': 'const string Stores = "stores"; const string Own = "own";',
  'Module-B/Inv/Inv.Infrastructure/Constants/Collections.cs': 'const string Stores = "stores";',
  // Productor por nombre de archivo, en una carpeta cuyo nombre no es el del evento
  [`Module-A/Svc/${EV}/Producers/Store/IntegrateStoreProducer.cs`]: 'class IntegrateStoreProducer { var e = new IntegrateStore { Address = new StoreAddress() }; }',
  [`Module-A/Svc/${EV}/Producers/Store/IntegrateStore.cs`]: 'namespace IntegrationEvents.Events; public record IntegrateStore; public record StoreAddress;',
  // Productor que recibe el evento como parámetro
  [`Module-A/Svc/${EV}/Producers/Downgrade/SubscriptionDowngradeProducer.cs`]: 'class SubscriptionDowngradeProducer { Task Send(ApplyDowngrade command) => Publish(command); }',
  [`Module-A/Svc/${EV}/Producers/Downgrade/ApplyDowngrade.cs`]: 'namespace IntegrationEvents.Events; public record ApplyDowngrade;',
  // Consumidores con distintas bases, batcheado, y el registro AddConsumer (que no cuenta)
  [`Module-B/Inv/${EV}/Consumers/Store/StoreConsumer.cs`]: 'class C : BaseSyncConsumer<IntegrateStore> {} class D : IConsumer<Batch<ApplyDowngrade>> {}',
  'Module-B/Inv/Inv.API/Program.cs': 'x.AddConsumer<StoreConsumer>();',
  // Tests de C# excluidos
  [`Module-B/Inv.Tests/${EV}/Consumers/X/FakeConsumer.cs`]: 'class F : IConsumer<TestEvent> {}',
  // Python: productor por urn, consumidor por message_name, interno excluido, tests excluidos
  'Module-P/svc_a/app/publishers/p.py': 'message_type = "urn:message:IntegrationEvents.Events:IntegrateStore"',
  'Module-P/svc_b/app/consumers/c.py': 'class C(BaseConsumer):\n    message_name = "ApplyDowngrade"',
  'Module-P/svc_b/app/consumers/internal.py': 'message_type = "Integration.Internal"\nmessage_name = "StartSync"',
  'Module-P/svc_b/tests/test_c.py': 'message_name = "OnlyInTests"',
  // Evento que emiten dos repos y consume uno de ellos: el consumidor cuenta por el productor del otro repo
  [`Module-B/Inv/${EV}/Producers/Mgmt/IntegrationCreateProducer.cs`]: 'class IntegrationCreateProducer {}',
  'Module-P/svc_a/app/publishers/mgmt.py': 'message_type = "urn:message:IntegrationEvents.Events:IntegrationCreate"',
  'Module-P/mgmt/app/consumers/create.py': 'exchange_name = "IntegrationEvents.Events:IntegrationCreate"',
  // Producer que recibe un evento que consume para publicar otro: no lo convierte en productor del primero
  [`Module-B/Inv/${EV}/Producers/Taxes/TaxesCalculatedProducer.cs`]: 'class TaxesCalculatedProducer { Task Publish(IntegrateStore store) {} }',
  // Evento consumido sin productor detectado
  [`Module-A/Svc/${EV}/Consumers/Owner/OwnerConsumer.cs`]: 'class O : IConsumer<OwnerCreated> {}',
  // Lambda
  'CloudFunctions/fn/lambda_function.py': "send_event_message(entity_event='InvoiceEmitted')",
});

test('colecciones: detecta las declaradas en más de un repo', () => {
  const { collections, shared } = scan(repos);
  assert.equal(collections, 2);
  assert.deepEqual(shared, { stores: ['Module-A/Svc', 'Module-B/Inv'] });
});

test('eventos C#: productor por nombre de archivo y por parámetro; no por carpeta ni sub-records', () => {
  const { events } = scan(repos);
  assert.deepEqual(events.IntegrateStore.producers, ['Module-A', 'Module-P/svc_a']);
  assert.deepEqual(events.ApplyDowngrade.producers, ['Module-A']);
  assert.ok(!events.IntegrateStore.producers.includes('Module-B'), 'Module-B solo consume IntegrateStore');
  assert.equal(events.Store, undefined);
  assert.equal(events.StoreAddress, undefined);
  assert.equal(events.Downgrade, undefined);
});

test('eventos: consumidores C# (cualquier base *Consumer, batch) y Python; excluye registro, internos y tests', () => {
  const { events } = scan(repos);
  assert.deepEqual(events.IntegrateStore.consumers, ['Module-B']);
  assert.deepEqual(events.ApplyDowngrade.consumers, ['Module-B', 'Module-P/svc_b']);
  for (const e of ['StoreConsumer', 'StartSync', 'OnlyInTests', 'TestEvent']) assert.equal(events[e], undefined, e);
  assert.deepEqual(events.InvoiceEmitted, { producers: ['CloudFunctions/fn'], consumers: [], repos: 1 });
});

test('eventos: un consumidor del mismo repo que un productor cuenta si otro repo también lo produce', () => {
  assert.deepEqual(scan(repos).events.IntegrationCreate.consumers, ['Module-P/mgmt']);
});

test('eventos sin productor detectado conservan sus consumidores y se listan en el markdown', () => {
  const result = scan(repos);
  assert.deepEqual(result.events.OwnerCreated, { producers: [], consumers: ['Module-A'], repos: 1 });
  assert.match(toMarkdown(result), /1 con consumidor pero sin productor detectado: OwnerCreated\./);
});

test('markdown: tabla de eventos con 3 o más repos y colecciones compartidas', () => {
  const md = toMarkdown(scan(repos));
  assert.match(md, /\| IntegrateStore \| Module-A, Module-P\/svc_a \| B \|/);
  assert.match(md, /\| `stores` \| A\/Svc, B\/Inv \|/);
});
