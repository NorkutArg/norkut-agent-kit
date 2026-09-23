#!/usr/bin/env node
// Relevamiento de colecciones Mongo y eventos de integración en los repos de NorkutArg.
// Es la fuente de modules.md y event-contracts.md de norkut-core: correrlo en la revisión trimestral
// (T3.2) y comparar contra la memoria.
//
//   node scripts/scan-repos.js <ruta a repos/> [--json | --markdown]
//
// Qué detecta:
// - Colecciones: `const string X = "nombre"` en `*/Constants/Collections.cs`.
// - Eventos C# (por contenido; el nombre de la carpeta no siempre es el del evento): consumidores por
//   cualquier base `*Consumer<X>` (`IConsumer`, `ContextConsumer`, `BaseSyncConsumer`…, y `Batch<X>`); productores por
//   `<X>Producer.cs` y por los tipos que usa un producer cuando X es un record de `IntegrationEvents.Events` que
//   algún repo consume.
// - Eventos Python: `urn:message:IntegrationEvents.Events:<Evento>` (productor), `entity_event='<Evento>'`
//   (Lambdas), `message_name = "<Evento>"` con `message_type` por defecto o `IntegrationEvents.Events`,
//   y `exchange_name = "IntegrationEvents.Events:<Evento>"` (consumidores).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'bin', 'obj', '.venv', 'venv', 'dist', 'tests', 'norkut-agent-kit']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.endsWith('.Tests')) yield* walk(p);
    } else yield p;
  }
}

const add = (map, key, value) => (map.get(key) ?? map.set(key, new Set()).get(key)).add(value);

export function scan(reposDir) {
  const collections = new Map(); // nombre → {repo/servicio}
  const producers = new Map();   // evento → {repo o repo/servicio}
  const consumers = new Map();
  const candidates = new Map(); // tipos usados en un producer: evento si X es un record de IntegrationEvents.Events
  const records = new Set(); // `repo:Record` declarados bajo Producers/ en namespace IntegrationEvents.Events

  for (const repo of readdirSync(reposDir).sort()) {
    const root = join(reposDir, repo);
    if (!statSync(root).isDirectory() || SKIP_DIRS.has(repo)) continue;
    for (const file of walk(root)) {
      const parts = relative(root, file).split(sep);
      const where = parts.length > 1 ? `${repo}/${parts[0]}` : repo;
      const dir = parts.slice(0, -1).join('/');

      if (basename(file) === 'Collections.cs' && dir.includes('Constants')) {
        const text = readFileSync(file, 'utf8');
        for (const [, name] of text.matchAll(/const\s+string\s+\w+\s*=\s*"([^"]+)"/g)) add(collections, name, where);
      }

      if (file.endsWith('.cs') && dir.includes('IntegrationEvents')) {
        const text = readFileSync(file, 'utf8');
        // Consumidores: las firmas de MassTransit y de BackAegis.ContextManager, batcheadas incluidas.
        // (IConsumer, ContextConsumer, ContextBatchConsumer, BaseSyncConsumer…; no AddConsumer<XConsumer>, que es el registro).
        for (const [, base, e] of text.matchAll(/\b(\w*Consumer)<(?:Batch<)?([A-Za-z0-9]{2,})>/g)) {
          if (base !== 'AddConsumer' && !e.endsWith('Consumer')) add(consumers, e, repo);
        }
        if (dir.includes('/Producers') || dir.startsWith('Producers')) {
          // Productores: `<Evento>Producer.cs`, y los tipos que usa un producer (lo construya con `new` o lo reciba
          // como parámetro): uno puede publicar varios eventos y su nombre no siempre es el del evento.
          const own = basename(file).match(/^([A-Za-z0-9]+)Producer\.cs$/);
          if (own && !/^I[A-Z]/.test(own[1]) && !own[1].endsWith('Producer')) add(producers, own[1], repo);
          if (/Producer\.cs$/.test(file)) for (const [, e] of text.matchAll(/\b([A-Z][A-Za-z0-9]+)\b/g)) add(candidates, e, repo);
          if (/namespace\s+IntegrationEvents\.Events/.test(text)) for (const [, e] of text.matchAll(/\brecord\s+([A-Za-z0-9]+)/g)) records.add(`${repo}:${e}`);
        }
      }

      if (file.endsWith('.py')) {
        const text = readFileSync(file, 'utf8');
        for (const [, e] of text.matchAll(/urn:message:IntegrationEvents\.Events:([A-Za-z0-9]+)/g)) add(producers, e, where);
        for (const [, e] of text.matchAll(/entity_event\s*=\s*['"]([A-Za-z0-9]+)['"]/g)) add(producers, e, where);
        for (const [, e] of text.matchAll(/exchange_name\s*=\s*['"]IntegrationEvents\.Events:([A-Za-z0-9]+)['"]/g)) add(consumers, e, where);
        const type = text.match(/message_type\s*=\s*['"]([A-Za-z0-9.]+)['"]/)?.[1] ?? 'IntegrationEvents.Events';
        if (type === 'IntegrationEvents.Events') {
          for (const [, e] of text.matchAll(/message_name\s*=\s*['"]([A-Za-z0-9]+)['"]/g)) add(consumers, e, where);
        }
      }
    }
  }

  // Un tipo usado en un producer solo cuenta si además se consume en algún repo: descarta sub-records del payload.
  // Y el record tiene que estar declarado bajo Producers/ del mismo repo: un producer puede recibir un evento que
  // consume (p. ej. BillChanged en Module-FMS) para publicar otro.
  for (const [e, where] of candidates) {
    if (consumers.has(e)) for (const w of where) if (records.has(`${w}:${e}`)) add(producers, e, w);
  }

  const repoOf = (w) => w.split('/')[0];
  const sorted = (set) => [...(set ?? [])].sort();
  const events = {};
  for (const name of [...new Set([...producers.keys(), ...consumers.keys()])].sort()) {
    const prod = sorted(producers.get(name));
    // Consumidor cross-repo: hay al menos un productor en otro repo (Module-POS → Module-Integrations aunque
    // Module-Integrations también produzca el evento).
    // Sin productor detectado se listan todos los consumidores: justamente son los casos a investigar.
    const all = sorted(consumers.get(name));
    const cons = prod.length ? all.filter((w) => prod.some((p) => repoOf(p) !== repoOf(w))) : all;
    events[name] = { producers: prod, consumers: cons, repos: new Set([...prod, ...cons].map(repoOf)).size };
  }
  const shared = {};
  for (const [name, set] of [...collections].sort()) {
    if (new Set([...set].map(repoOf)).size > 1) shared[name] = sorted(set);
  }
  return { collections: collections.size, shared, events };
}

export function toMarkdown({ collections, shared, events }) {
  const short = (w) => w.replace(/^Module-/, '');
  const rows = Object.entries(events)
    .filter(([name, e]) => e.repos >= 3 && !name.endsWith('Request'))
    .sort(([a, x], [b, y]) => y.repos - x.repos || a.localeCompare(b))
    .map(([name, e]) => `| ${name} | ${e.producers.join(', ') || '_no detectado_'} | ${e.consumers.map(short).join(', ')} |`);
  const noProducer = Object.entries(events).filter(([, e]) => !e.producers.length && e.consumers.length).map(([n]) => n);
  return [
    `## Eventos con 3 o más repos involucrados`,
    '',
    '| Evento | Emite | Consumen |',
    '|---|---|---|',
    ...rows,
    '',
    `${Object.keys(events).length} eventos detectados; ${noProducer.length} con consumidor pero sin productor detectado: ${noProducer.join(', ')}.`,
    '',
    `## Colecciones declaradas en más de un repo (${Object.keys(shared).length} de ${collections})`,
    '',
    '| Colección | Repos que la declaran |',
    '|---|---|',
    ...Object.entries(shared).map(([name, where]) => `| \`${name}\` | ${where.map(short).join(', ')} |`),
    '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const [dir, mode = '--markdown'] = process.argv.slice(2);
  if (!dir) {
    console.error('Uso: node scripts/scan-repos.js <ruta a repos/> [--json | --markdown]');
    process.exit(1);
  }
  const result = scan(dir);
  console.log(mode === '--json' ? JSON.stringify(result, null, 1) : toMarkdown(result));
}
