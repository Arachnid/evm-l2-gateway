import { Request as CFWRequest } from '@cloudflare/workers-types';
import { Server } from '@ensdomains/ccip-read-cf-worker';
import { propsDecoder, type Router } from '@ensdomains/evm-gateway';
import { Tracker } from '@ensdomains/server-analytics';

interface Env {
  L1_PROVIDER_URL: string;
  L2_PROVIDER_URL: string;
  L2_OPTIMISM_PORTAL: string;
  DELAY: number;
  GATEWAY_DOMAIN: string;
  ENDPOINT_URL: string;
}

let app: Router;

async function fetch(request: CFWRequest, env: Env) {
  // Set PROVIDER_URL under .dev.vars locally. Set the key as secret remotely with `wrangler secret put WORKER_PROVIDER_URL`
  const {
    L1_PROVIDER_URL,
    L2_PROVIDER_URL,
    L2_OPTIMISM_PORTAL,
    DELAY,
    GATEWAY_DOMAIN,
    ENDPOINT_URL,
  } = env;

  const tracker = new Tracker(GATEWAY_DOMAIN, {
    apiEndpoint: ENDPOINT_URL,
    enableLogging: true,
  });

  // Loading libraries dynamically as a temp work around.
  // Otherwise, deployment thorws "Error: Script startup exceeded CPU time limit." error
  if (!app) {
    const ethers = await import('ethers');
    const EVMGateway = (await import('@ensdomains/evm-gateway')).EVMGateway;
    const OPProofService = (await import('./OPProofService.js')).OPProofService;
    const l1Provider = new ethers.JsonRpcProvider(L1_PROVIDER_URL);
    const l2Provider = new ethers.JsonRpcProvider(L2_PROVIDER_URL);

    console.log({ L1_PROVIDER_URL, L2_PROVIDER_URL, DELAY });
    const gateway = new EVMGateway(
      new OPProofService(
        l1Provider,
        l2Provider,
        L2_OPTIMISM_PORTAL,
        Number(DELAY)
      )
    );

    const server = new Server();
    gateway.add(server);
    app = server.makeApp('/');
  }

  const props = propsDecoder(request);
  await tracker.trackEvent(request, 'request', { props }, true);
  return app
    .handle(request)
    .then(tracker.logResult.bind(tracker, propsDecoder, request));
}

export default {
  fetch,
};
