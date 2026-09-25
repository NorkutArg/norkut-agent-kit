import { claude, claudeJson } from './claude.js';
import { KIT_ROOT, pinnedSource } from './init.js';
import { kitInfo } from './kit.js';

// Refresca el marketplace y actualiza los plugins Norkut instalados; avisa si no quedan en la versión que pinea el kit.
export function update({ env = process.env, kitRoot = KIT_ROOT, log = console.log } = {}) {
  const kit = kitInfo(kitRoot);
  const run = (args) => {
    const res = claude(args, { env });
    if (res.missing) throw new Error('Claude Code no está instalado. Correr `init` primero.');
    if (!res.ok) throw new Error(`claude ${args.join(' ')} falló: ${res.stderr.trim()}`);
  };

  const configured = claudeJson(['plugin', 'marketplace', 'list'], { env }).find((m) => m.name === kit.marketplace);
  if (!configured) throw new Error(`Marketplace ${kit.marketplace} no configurado. Correr \`init\` primero.`);
  if (configured.source === 'directory') {
    // Desarrollo del kit (`init --source ./`): se deja apuntando a la carpeta local.
    log(`✔ Marketplace ${kit.marketplace} local (${configured.path}); no se re-pinea`);
  } else {
    // Volver a agregarlo con el tag de esta versión del kit lo reemplaza en el lugar; los plugins no se desinstalan.
    const source = pinnedSource(kitRoot);
    run(['plugin', 'marketplace', 'add', source]);
    log(`✔ Marketplace ${kit.marketplace} pineado a ${source}`);
  }
  run(['plugin', 'marketplace', 'update', kit.marketplace]);

  const before = new Map(claudeJson(['plugin', 'list'], { env }).map((p) => [p.id, p.version]));
  const ids = Object.keys(kit.plugins).filter((id) => before.has(id));
  for (const id of ids) run(['plugin', 'update', id, '--scope', 'user']);

  const after = new Map(claudeJson(['plugin', 'list'], { env }).map((p) => [p.id, p.version]));
  const behind = [];
  for (const id of ids) {
    const [from, to, pinned] = [before.get(id), after.get(id), kit.plugins[id]];
    log(from === to ? `✔ ${id} ${to} (sin cambios)` : `✔ ${id} ${from} → ${to}`);
    if (to !== pinned) behind.push(`${id}: instalado ${to}, el kit pinea ${pinned}`);
  }
  for (const b of behind) log(`⚠ ${b}. Actualizar el kit (\`npx @norkutarg/agent-kit@latest update\`) o revisar el marketplace.`);
  return { updated: ids.filter((id) => before.get(id) !== after.get(id)), behind };
}
