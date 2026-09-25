// Convención de ClickUp en branches y commits (memory/workflow.md). Modo: aviso.
// - Branch: [<tipo>/]CU-<id>_<descripcion-corta>_<Nombre-Apellido>
// - Commit: CU-<id>[<estado>] con un estado de ClickUp, sin espacio antes del corchete
import { spawnSync } from 'node:child_process';
import { isNorkutRepo, readInput, warn } from './lib.mjs';

// Estados del Space "Producto Norkut" (memory/workflow.md). test/conventions.test.js verifica que coincidan.
const STATUSES = ['backlog', 'planning', 'plan validated', 'to do', 'in progress', 'qa testing', 'completed', 'closed'];
const LONG_LIVED = new Set(['main', 'master', 'develop', 'HEAD']);
const BRANCH_FORMAT = /^(?:[a-z]+\/)?CU-[a-z0-9]+_[A-Za-z0-9-]+_[A-Za-z0-9-]+$/;

const git = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
// `git <subcomando>` admitiendo opciones globales antes (`git -c k=v commit`, `git -C dir push`, `git --no-pager …`).
const GIT = String.raw`\bgit\s+(?:(?:-[cC]\s+\S+|--[\w-]+(?:=\S+)?)\s+)*`;

// Palabras → guiones, sin acentos ni símbolos: "Diego Ramírez" → "Diego-Ramirez".
function slug(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Branch nuevo (checkout -b / switch -c / git branch <nombre>) o, para un push, el branch actual.
function targetBranch(cmd, dir) {
  const created = cmd.match(new RegExp(String.raw`${GIT}(?:checkout\s+-b|switch\s+(?:-c|--create)|branch)\s+([^\s-]\S*)`));
  if (created) return created[1];
  if (new RegExp(String.raw`${GIT}push\b`).test(cmd)) {
    const res = git(dir, 'symbolic-ref', '--short', 'HEAD');
    return res.status === 0 ? res.stdout.trim() : null;
  }
  return null;
}

function branchWarning(branch, dir) {
  if (!branch || LONG_LIVED.has(branch) || branch.startsWith('memory/') || BRANCH_FORMAT.test(branch)) return null;
  const user = slug(git(dir, 'config', 'user.name').stdout.trim()) || '<Nombre-Apellido>';
  const id = branch.match(/CU-[a-z0-9]+/i)?.[0] ?? 'CU-<id>';
  const example = `${id}_<descripcion-corta>_${user}`;
  return `branch-guard: el branch \`${branch}\` no sigue el formato \`[<tipo>/]CU-<id>_<descripcion-corta>_<Nombre-Apellido>\` (p. ej. \`${example}\`). Con el ID de ClickUp en el nombre, la integración GitHub–ClickUp lo vincula sola; \`/norkut-core:start-task\` lo arma.`;
}

function commitWarnings(cmd) {
  if (!new RegExp(String.raw`${GIT}commit\b`).test(cmd)) return [];
  const out = [];
  for (const [, id, status] of cmd.matchAll(/\b(CU-[a-z0-9]+)\[([^\]]*)\]/gi)) {
    if (!STATUSES.includes(status.trim().toLowerCase())) {
      out.push(`\`${id}[${status}]\`: "${status}" no es un estado de ClickUp (${STATUSES.join(', ')}); la tarea no va a cambiar de estado.`);
    }
  }
  for (const [, id] of cmd.matchAll(/\b(CU-[a-z0-9]+)\s+\[/gi)) {
    out.push(`\`${id} [\`: ClickUp no toma el estado si hay un espacio entre el ID y el corchete; usar \`${id}[<estado>]\`.`);
  }
  return out;
}

const input = readInput();
const command = input.tool_input?.command ?? '';
const cwd = input.cwd ?? process.cwd();
if (!/\bgit\b/.test(command) || !isNorkutRepo(cwd)) process.exit(0);

const warnings = [branchWarning(targetBranch(command, cwd), cwd), ...commitWarnings(command).map((w) => `branch-guard: ${w}`)].filter(Boolean);
if (warnings.length) warn(warnings.join('\n'));
