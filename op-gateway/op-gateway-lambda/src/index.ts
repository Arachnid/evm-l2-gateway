import { ServerLambda } from './aws-lambda-ccip-router';
import { TrackerLambda, PropsDecoderLambda } from './aws-lambda-tracker';
import { EVMGateway } from '@ensdomains/evm-gateway';
import { OPProofService } from '../../src/OPProofService';
import { JsonRpcProvider } from 'ethers';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { AwsRequestContext } from './AWSRequestContext';

interface RouterLambda {
  handle: (request: AwsRequestContext) => Promise<APIGatewayProxyResult>;
}

let app: RouterLambda;

export const gatewayHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const L1_PROVIDER_URL: string = process.env.l1_provider_url || '';
  const L2_PROVIDER_URL: string = process.env.l2_provider_url || '';
  const L2_OPTIMISM_PORTAL: string = process.env.l2_optimism_portal || '';
  const DELAY: string = process.env.delay || '';
  const GATEWAY_DOMAIN: string = process.env.gateway_domain || '';
  const ENDPOINT_URL: string = process.env.endpoint_url || '';

  const tracker = new TrackerLambda(GATEWAY_DOMAIN, {
    apiEndpoint: ENDPOINT_URL,
    enableLogging: true,
  });

  if (!app) {
    const l1Provider = new JsonRpcProvider(L1_PROVIDER_URL);
    const l2Provider = new JsonRpcProvider(L2_PROVIDER_URL);

    console.log({ L1_PROVIDER_URL, L2_PROVIDER_URL, DELAY });
    const gateway = new EVMGateway(
      new OPProofService(
        l1Provider,
        l2Provider,
        L2_OPTIMISM_PORTAL,
        Number(DELAY)
      )
    );

    const server = new ServerLambda();
    gateway.add(server);
    app = server.makeApp('');
  }

  const props = propsDecoderAWS(event);
  await tracker.trackEvent(event, 'request', { props }, true);

  const requestContext = new AwsRequestContext(event, context);
  return app
    .handle(requestContext)
    .then(tracker.logResult.bind(tracker, propsDecoderAWS, event));
};

const propsDecoderAWS: PropsDecoderLambda<APIGatewayProxyEvent> = (
  request?: APIGatewayProxyEvent
) => {
  if (!request || !request.path) {
    return {};
  }
  const trackingData = request.path.match(
    /\/0x[a-fA-F0-9]{40}\/0x[a-fA-F0-9]{1,}\.json/
  );
  if (trackingData) {
    return {
      sender: trackingData[0].slice(1, 42),
      calldata: trackingData[0].slice(44).replace('.json', ''),
    };
  } else {
    return {};
  }
};
