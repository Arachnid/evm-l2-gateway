import { Request as CFWRequest } from '@cloudflare/workers-types';
import { CcipReadRouter } from '@ensdomains/ccip-read-router';
import { EVMGateway, propsDecoder } from '@ensdomains/evm-gateway';
import { Tracker } from '@ensdomains/server-analytics';
import { createClient, http, type Address } from 'viem';

import { ArbProofService } from './ArbProofService.js';
import { InMemoryBlockCache } from './blockCache/InMemoryBlockCache.js';

interface Env {
  L1_PROVIDER_URL: string;
  L2_PROVIDER_URL: string;
  L2_ROLLUP: Address;
  GATEWAY_DOMAIN: string;
  ENDPOINT_URL: string;
}

async function fetch(request: CFWRequest, env: Env) {
  // Set PROVIDER_URL under .dev.vars locally. Set the key as secret remotely with `wrangler secret put WORKER_PROVIDER_URL`
  const {
    L1_PROVIDER_URL,
    L2_PROVIDER_URL,
    L2_ROLLUP,
    GATEWAY_DOMAIN,
    ENDPOINT_URL,
  } = env;
  const tracker = new Tracker(GATEWAY_DOMAIN, {
    apiEndpoint: ENDPOINT_URL,
    enableLogging: true,
  });

  const l1Client = createClient({ transport: http(L1_PROVIDER_URL) });
  const l2Client = createClient({ transport: http(L2_PROVIDER_URL) });

  const proofService = new ArbProofService({
    l1Client,
    l2Client,
    l2RollupAddress: L2_ROLLUP,
    cache: new InMemoryBlockCache(),
  });

  const gateway = new EVMGateway(proofService);
  const router = CcipReadRouter();
  gateway.add(router);

  const props = propsDecoder(request);
  await tracker.trackEvent(request, 'request', { props }, true);
  return router
    .fetch(request)
    .then(tracker.logResult.bind(tracker, propsDecoder, request));
}

export default {
  fetch,
};
