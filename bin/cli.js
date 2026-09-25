#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { init, ROLES } from '../src/init.js';
import { sync } from '../src/sync.js';
import { doctor } from '../src/doctor.js';
import { update } from '../src/update.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const program = new Command();

program
  .name('norkut-agent-kit')
  .description(pkg.description)
  .version(pkg.version);

program
  .command('init')
  .description('Configura la máquina del dev: marketplace, plugins norkut-core + rol, MCPs y env vars faltantes')
  .requiredOption('--role <role>', `rol del dev (${ROLES.join('|')})`)
  .option('--source <source>', 'origen del marketplace; por defecto NorkutArg/norkut-agent-kit@v<versión del kit>. Para desarrollo: ./')
  .action((opts) => {
    if (!ROLES.includes(opts.role)) {
      program.error(`--role inválido: "${opts.role}". Opciones: ${ROLES.join(', ')}`);
    }
    try {
      init({ role: opts.role, source: opts.source });
    } catch (err) {
      program.error(err.message);
    }
  });

program
  .command('sync')
  .description('En la raíz de un repo: crea CLAUDE.md si falta, genera .claude/rules y .cursor/rules desde .agent/rules y copia el contexto compartido')
  .action(() => {
    try {
      sync();
    } catch (err) {
      program.error(err.message);
    }
  });

program
  .command('doctor')
  .description('Reporta versión del kit, plugins, MCPs, env vars faltantes y drift de reglas generadas')
  .option('--no-mcp', 'no chequear la conexión de los MCPs (más rápido)')
  .action((opts) => {
    const { problems } = doctor({ mcp: opts.mcp });
    if (problems.length) process.exitCode = 1;
  });

program
  .command('update')
  .description('Actualiza los plugins Norkut a la versión pineada por el kit')
  .action(() => {
    try {
      update();
    } catch (err) {
      program.error(err.message);
    }
  });

await program.parseAsync();
