import { EVMGateway } from '@ensdomains/evm-gateway';
import { createClient, http } from 'viem';
import { L1ProofService, type L1ProvableBlock } from './L1ProofService.js';

export type L1Gateway = EVMGateway<L1ProvableBlock>;

export function createL1Gateway(providerUrl: string): L1Gateway {
  const client = createClient({ transport: http(providerUrl) });

  const proofService = new L1ProofService(client);

  return new EVMGateway(proofService);
}

export { L1ProofService, type L1ProvableBlock };
