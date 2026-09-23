#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const ROLES = ['backend', 'frontend', 'pm'];

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
  .action((opts) => {
    if (!ROLES.includes(opts.role)) {
      program.error(`--role inválido: "${opts.role}". Opciones: ${ROLES.join(', ')}`);
    }
    notImplemented('T0.6')();
  });

program
  .command('sync')
  .description('En la raíz de un repo: crea CLAUDE.md si falta, genera .claude/rules y .cursor/rules desde .agent/rules y copia el contexto compartido')
  .action(notImplemented('T0.7'));

program
  .command('doctor')
  .description('Reporta versión del kit, plugins, MCPs, env vars faltantes y drift de reglas generadas')
  .action(notImplemented('T0.8'));

program
  .command('update')
  .description('Actualiza los plugins Norkut a la versión pineada por el kit')
  .action(notImplemented('T0.8'));

await program.parseAsync();
