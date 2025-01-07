import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

export class OPGateway extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const opGatewayFunction = new NodejsFunction(this, 'function', {
      environment: {
        l1_provider_url: process.env.L1_PROVIDER_URL || '',
        l2_provider_url: process.env.L2_PROVIDER_URL || '',
        l2_optimism_portal: process.env.L2_OPTIMISM_PORTAL || '',
        delay: process.env.DELAY || '',
        gateway_domain: process.env.GATEWAY_DOMAIN || '',
        endpoint_url: process.env.ENDPOINT_URL || '',
      },
      timeout: Duration.seconds(15),
    });
    new LambdaRestApi(this, 'OpGatewayApi', {
      handler: opGatewayFunction,
    });
  }
}
