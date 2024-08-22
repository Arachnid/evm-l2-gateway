import { Command } from '@commander-js/extra-typings';
import { CcipReadRouter } from '@ensdomains/ccip-read-router';
import { EVMGateway } from '@ensdomains/evm-gateway';
import { createClient, http, isAddress } from 'viem';

import { ArbProofService } from './ArbProofService.js';
import { InMemoryBlockCache } from './blockCache/InMemoryBlockCache.js';

const program = new Command()
  .option('-p, --port <port>', 'port to listen on', '8080')
  .option(
    '-u, --l1-provider-url <url>',
    'l1 provider url',
    'http://localhost:8545/'
  )
  .option(
    '-v, --l2-provider-url <url>',
    'l2 provider url',
    'http://localhost:9545/'
  )
  .option(
    '-o --l2-rollup-address <address>',
    'address for L2 outbox on the L1',
    process.env.ROLLUP_ADDRESS
  );

program.parse();

const { l1ProviderUrl, l2ProviderUrl, l2RollupAddress, port } = program.opts();
if (!isAddress(l2RollupAddress))
  throw new Error('Invalid address format for L2 rollup');

const l1Client = createClient({ transport: http(l1ProviderUrl) });
const l2Client = createClient({ transport: http(l2ProviderUrl) });

const proofService = new ArbProofService({
  l1Client,
  l2Client,
  l2RollupAddress,
  cache: new InMemoryBlockCache(),
});
const gateway = new EVMGateway(proofService);

const router = CcipReadRouter({
  port,
});
gateway.add(router);

export default router;
