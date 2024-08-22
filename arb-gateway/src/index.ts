import { EVMGateway } from '@ensdomains/evm-gateway';
import { createClient, http, type Address } from 'viem';

import { ArbProofService, type ArbProvableBlock } from './ArbProofService.js';
import { InMemoryBlockCache } from './blockCache/InMemoryBlockCache.js';

export type ArbGateway = EVMGateway<ArbProvableBlock>;

export async function createArbGateway({
  l1ProviderUrl,
  l2ProviderUrl,
  l2RollupAddress,
}: {
  l1ProviderUrl: string;
  l2ProviderUrl: string;
  l2RollupAddress: Address;
}) {
  const l1Client = createClient({ transport: http(l1ProviderUrl) });
  const l2Client = createClient({ transport: http(l2ProviderUrl) });

  const proofService = new ArbProofService({
    l1Client,
    l2Client,
    l2RollupAddress,
    cache: new InMemoryBlockCache(),
  });

  return new EVMGateway(proofService);
}

export { ArbProofService, type ArbProvableBlock };
