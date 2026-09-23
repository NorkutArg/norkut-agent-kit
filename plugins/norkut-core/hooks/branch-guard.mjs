// Avisa si se crea o pushea un branch sin ID de ClickUp. Modo: aviso.
import { spawnSync } from 'node:child_process';
import { isNorkutRepo, readInput, warn } from './lib.mjs';

const LONG_LIVED = new Set(['main', 'master', 'develop', 'HEAD']);
const input = readInput();
const command = input.tool_input?.command ?? '';
const cwd = input.cwd ?? process.cwd();

// Branch nuevo (checkout -b / switch -c) o, para un push, el branch actual.
function targetBranch(cmd, dir) {
  const created = cmd.match(/\bgit\s+(?:checkout\s+-b|switch\s+(?:-c|--create))\s+(\S+)/);
  if (created) return created[1];
  if (/\bgit\s+push\b/.test(cmd)) {
    const res = spawnSync('git', ['-C', dir, 'symbolic-ref', '--short', 'HEAD'], { encoding: 'utf8' });
    return res.status === 0 ? res.stdout.trim() : null;
  }
  return null;
}

const branch = targetBranch(command, cwd);
if (branch && !LONG_LIVED.has(branch) && !/CU-[a-z0-9]+/i.test(branch) && isNorkutRepo(cwd)) {
  warn(`branch-guard: el branch \`${branch}\` no tiene ID de ClickUp. Formato: \`<tipo>/CU-<id>-<slug>\` (p. ej. \`feature/CU-86abc123-sync-stock\`), así la integración GitHub–ClickUp lo linkea sola.`);
}
