#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { OpGatewayLambdaStack } from '../lib/op-gateway-lambda-stack';

const app = new cdk.App();
new OpGatewayLambdaStack(app, 'OpGatewayLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
