import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { gatewayHandler } from '../src/index';

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
  return gatewayHandler(event, context);
};
