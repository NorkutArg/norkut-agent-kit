#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { init, ROLES } from '../src/init.js';
import { sync } from '../src/sync.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function notImplemented(task) {
  return () => {
    console.error(`No implementado todavía (${task} en PLAN.md).`);
    process.exitCode = 1;
  };
}

const program = new Command();

program
  .name('norkut-agent-kit')
  .description(pkg.description)
  .version(pkg.version);

program
  .command('init')
  .description('Configura la máquina del dev: marketplace, plugins norkut-core + rol, MCPs y env vars faltantes')
  .requiredOption('--role <role>', `rol del dev (${ROLES.join('|')})`)
  .option('--source <source>', 'origen del marketplace (repo de GitHub o ruta local)')
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
  .action(notImplemented('T0.8'));

program
  .command('update')
  .description('Actualiza los plugins Norkut a la versión pineada por el kit')
  .action(notImplemented('T0.8'));

await program.parseAsync();
