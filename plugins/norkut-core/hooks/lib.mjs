import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Entrada del hook (PreToolUse) desde stdin.
export function readInput() {
  return JSON.parse(readFileSync(0, 'utf8'));
}

// Texto nuevo que escribe un Write o un Edit (con o sin `edits`).
export function newText(toolInput = {}) {
  const parts = [toolInput.content, toolInput.new_string, ...(toolInput.edits ?? []).map((e) => e.new_string)];
  return parts.filter((p) => typeof p === 'string').join('\n');
}

// Los hooks solo actúan en repos cuyo remoto es de la org NorkutArg: el plugin se instala a scope usuario
// y corre en todos los proyectos del dev.
export function isNorkutRepo(path) {
  let dir = path;
  while (dir && !existsSync(dir)) dir = dirname(dir);
  const res = spawnSync('git', ['-C', dir, 'remote', '-v'], { encoding: 'utf8' });
  return res.status === 0 && /NorkutArg\//.test(res.stdout);
}

export function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
  process.stderr.write(reason);
  process.exit(2);
}

export function warn(message) {
  process.stdout.write(JSON.stringify({
    systemMessage: message,
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message },
  }));
  process.exit(0);
}
