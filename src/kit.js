import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KIT_ROOT } from './init.js';

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Versión del kit y la de cada plugin que publica su marketplace (la que el kit pinea).
export function kitInfo(kitRoot = KIT_ROOT) {
  const marketplace = readJson(join(kitRoot, '.claude-plugin/marketplace.json'));
  const plugins = {};
  for (const name of readdirSync(join(kitRoot, 'plugins'))) {
    plugins[`${name}@${marketplace.name}`] = readJson(join(kitRoot, 'plugins', name, '.claude-plugin/plugin.json')).version;
  }
  return { version: readJson(join(kitRoot, 'package.json')).version, marketplace: marketplace.name, plugins };
}
