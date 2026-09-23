// Recuerda las reglas del contrato al tocar un evento de integración. Modo: aviso.
import { basename } from 'node:path';
import { isNorkutRepo, readInput, warn } from './lib.mjs';

const input = readInput();
const { file_path: file = '' } = input.tool_input ?? {};
if (!/\/IntegrationEvents\/.+\.cs$/.test(file) || !isNorkutRepo(file)) process.exit(0);
const event = basename(file, '.cs').replace(/(Consumer|Producer|ConsumerDefinition)$/, '');
warn(`contract-guard: ${basename(file)} es parte del contrato de \`${event}\`, que tiene copias en otros repos. Solo cambios aditivos: propiedades nuevas nullable y sin \`required\`; no renombrar el tipo, el namespace \`IntegrationEvents.Events\` ni el \`EndpointName\`. Antes de seguir, listar productores y consumidores con \`/norkut-core:event-contract-check\`.`);
