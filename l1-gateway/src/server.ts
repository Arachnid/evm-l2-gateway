import { Command } from '@commander-js/extra-typings';
import { CcipReadRouter } from '@ensdomains/ccip-read-router';
import { EVMGateway } from '@ensdomains/evm-gateway';
import { createClient, http } from 'viem';

import { L1ProofService } from './L1ProofService.js';

const program = new Command()
  .option('-p, --port <port>', 'port to listen on', '8080')
  .option('-u, --provider-url <url>', 'provider url', 'http://localhost:8545/');

program.parse();

const { port, providerUrl } = program.opts();

const client = createClient({ transport: http(providerUrl) });
const proofService = new L1ProofService(client);
const gateway = new EVMGateway(proofService);

const router = CcipReadRouter({ port });
gateway.add(router);

export default router;
