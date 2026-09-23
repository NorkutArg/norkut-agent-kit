import { spawnSync } from 'node:child_process';

// Wrapper del CLI de Claude Code. Toda llamada pasa por acá para poder reemplazar `claude` en los tests.
export function claude(args, { env = process.env } = {}) {
  const res = spawnSync('claude', args, { encoding: 'utf8', env });
  if (res.error?.code === 'ENOENT') return { ok: false, missing: true, stdout: '', stderr: '' };
  return { ok: res.status === 0, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

export function claudeJson(args, opts) {
  const res = claude([...args, '--json'], opts);
  if (!res.ok) throw new Error(`claude ${args.join(' ')} falló: ${res.stderr.trim()}`);
  return JSON.parse(res.stdout);
}
