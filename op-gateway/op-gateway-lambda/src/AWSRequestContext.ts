import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { RequestContext } from 'generic-rest-api-router';

/**
 * Implementation of the RequestContext interface that makes the AWS Lambda
 * APIGatewayProxyEvent and Context available to a handler.
 */
export class AwsRequestContext implements RequestContext {
  constructor(
    public event: APIGatewayProxyEvent,
    public context: Context
  ) {}

  getHttpMethod(): string {
    return this.event.requestContext.httpMethod;
  }

  getPath(): string {
    return this.event.path;
  }

  getBody(): string {
    return this.event.body || '';
  }
}
