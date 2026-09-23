#!/usr/bin/env node
// `claude` falso para tests: guarda marketplaces y plugins en FAKE_CLAUDE_STATE y registra cada llamada en FAKE_CLAUDE_LOG.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const { FAKE_CLAUDE_STATE: statePath, FAKE_CLAUDE_LOG: logPath } = process.env;
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
  console.log(JSON.stringify(state.plugins.map((id) => ({ id }))));
} else if (cmd.startsWith('plugin install ')) {
  const id = args[2];
  if (!state.marketplaces.includes(id.split('@')[1])) {
    console.error(`marketplace not found for ${id}`);
    process.exit(1);
  }
  state.plugins.push(id);
  save();
} else {
  console.error(`fake-claude: comando no soportado: ${args.join(' ')}`);
  process.exit(2);
}
