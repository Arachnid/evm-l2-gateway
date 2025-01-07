# Prerequisites

## Install AWS CLI and CDK

Refer to https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html for instructions.

## Configure AWS SSO

In order to give cdk functions access to your AWS account, configure AWS single sign-on (SSO) to connect to an IAM Identity Centre login.

See https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html for full details.

# Deployment

1. Log into AWS SSO if not already logged in.
```
aws sso login  --profile <profile-name>
```
The --profile argument can be omitted if the profile is called 'default'.

2. Set the following environment variables or add to a .env file in this directory. Alternatively these environment variables can be set later in the AWS Lambda function console.

- L1_PROVIDER_URL
- L2_PROVIDER_URL
- L2_OPTIMISM_PORTAL
- DELAY
- GATEWAY_DOMAIN
- ENDPOINT_URL

3. Deploy with the following steps
```
cdk bootstrap
cdk synth
cdk deploy
```
The lambda url is output towards the end of the last step under 'Outputs' as follows.
```
Outputs:
OpGatewayLambdaStack.OPGatewayOpGatewayApiEndpoint... = <lambda url>
...
```
To update an existing lambda function deployment without modifying the url, only the following steps are required.
```
cdk synth
cdk deploy
```

# Removing a deployed lambda function
The lambda function can be taken down with
```
cdk destroy
```

## Other useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk diff`    compare deployed stack with current state
