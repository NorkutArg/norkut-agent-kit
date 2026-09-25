// Bloquea Write/Edit que escriban credenciales. Modo: bloqueante.
import { deny, isNorkutRepo, newText, readInput } from './lib.mjs';

const PATTERNS = [
  ['connection string de Mongo con usuario y contraseña', /mongodb(\+srv)?:\/\/[^:\s/@]+:[^@\s]+@/],
  ['token de GitHub', /\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/],
  ['access key de AWS', /\bAKIA[0-9A-Z]{16}\b/],
  // Password= literal dentro de una connection string; se permiten placeholders (${...}, {...}, $(...)).
  ['contraseña en connection string', /(Server|Host|Data Source)=[^;\n]+;[^\n]*Password=(?![$\{])[^;\s"']+/i],
];

const input = readInput();
const { file_path: file = '' } = input.tool_input ?? {};
if (!isNorkutRepo(file)) process.exit(0);
const text = newText(input.tool_input);
const hit = PATTERNS.find(([, re]) => re.test(text));
if (hit) {
  deny(`secret-guard: el cambio en ${file} contiene una ${hit[0]}. Las credenciales van en configuración (appsettings por entorno, env vars), nunca en archivos del repo.`);
}
