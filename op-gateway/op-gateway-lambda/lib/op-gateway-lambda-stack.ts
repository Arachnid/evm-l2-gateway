import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OPGateway } from './op-gateway-lambda';

export class OpGatewayLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new OPGateway(this, 'OP-Gateway');
  }
}
