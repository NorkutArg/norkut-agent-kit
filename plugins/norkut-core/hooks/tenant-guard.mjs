// Avisa si un DAO/repositorio/handler .NET arma queries sin scope de tenant. Modo: aviso.
import { basename } from 'node:path';
import { isNorkutRepo, newText, readInput, warn } from './lib.mjs';

const input = readInput();
const { file_path: file = '' } = input.tool_input ?? {};
if (!/(Repository|Handler|Dao)[^/]*\.cs$/.test(basename(file)) || !isNorkutRepo(file)) process.exit(0);
const text = newText(input.tool_input);
const queries = /MongoDbQueryBuilder|\.InCollection\(|\bFind\(|\bFilter\./.test(text);
const scoped = /\.WithTenant\(|\.NonTenant\(|TenantId|SubscriptionId/.test(text);
if (queries && !scoped) {
  warn(`tenant-guard: ${basename(file)} arma una query sin \`.WithTenant(...)\` a la vista. Toda query lleva \`.WithTenant(...)\` o un \`.NonTenant()\` justificado; una query sin scope filtra datos entre clientes. Revisar antes de seguir, o correr \`/norkut-core:tenant-isolation-check\`.`);
}
