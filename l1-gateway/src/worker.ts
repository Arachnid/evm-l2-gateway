import type { Request as CFWRequest } from '@cloudflare/workers-types';
import { CcipReadRouter } from '@ensdomains/ccip-read-router';
import { EVMGateway } from '@ensdomains/evm-gateway';
import { createClient, http } from 'viem';
import { L1ProofService } from './L1ProofService.js';

interface Env {
  WORKER_PROVIDER_URL: string;
}

async function fetch(request: CFWRequest, env: Env) {
  const { WORKER_PROVIDER_URL } = env;

  const client = createClient({ transport: http(WORKER_PROVIDER_URL) });
  const proofService = new L1ProofService(client);
  const gateway = new EVMGateway(proofService);

  const router = CcipReadRouter();
  gateway.add(router);

  return router.fetch(request);
}

export default {
  fetch,
};
