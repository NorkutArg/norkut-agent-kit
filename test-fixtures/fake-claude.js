#!/usr/bin/env node
// `claude` falso para tests: guarda marketplaces y plugins en FAKE_CLAUDE_STATE y registra cada llamada en FAKE_CLAUDE_LOG.
// FAKE_CLAUDE_MARKET_VERSION: versión que el marketplace entrega al instalar o actualizar. FAKE_CLAUDE_MCP: salida de `mcp list`.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const { FAKE_CLAUDE_STATE: statePath, FAKE_CLAUDE_LOG: logPath, FAKE_CLAUDE_MARKET_VERSION: marketVersion = '0.1.0', FAKE_CLAUDE_MCP: mcp = '' } = process.env;
const args = process.argv.slice(2);
appendFileSync(logPath, JSON.stringify(args) + '\n');
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { marketplaces: [], plugins: [] };
const save = () => writeFileSync(statePath, JSON.stringify(state));
const cmd = args.filter((a) => !a.startsWith('--')).join(' ');

if (args[0] === '--version') {
  console.log('2.1.280 (Claude Code)');
} else if (cmd === 'plugin marketplace list') {
  console.log(JSON.stringify(state.marketplaces.map((name) => ({ name }))));
} else if (cmd.startsWith('plugin marketplace add ')) {
  state.marketplaces.push('norkut');
  save();
} else if (cmd === 'plugin list') {
  console.log(JSON.stringify(state.plugins));
} else if (cmd.startsWith('plugin install ')) {
  const id = args[2];
  if (!state.marketplaces.includes(id.split('@')[1])) {
    console.error(`marketplace not found for ${id}`);
    process.exit(1);
  }
  state.plugins.push({ id, version: marketVersion, enabled: true });
  save();
} else if (cmd === 'plugin marketplace update norkut') {
  // no-op: la versión nueva la define FAKE_CLAUDE_MARKET_VERSION
} else if (cmd.startsWith('plugin update ')) {
  state.plugins.find((p) => p.id === args[2]).version = marketVersion;
  save();
} else if (cmd === 'mcp list') {
  console.log(mcp);
} else {
  console.error(`fake-claude: comando no soportado: ${args.join(' ')}`);
  process.exit(2);
}
