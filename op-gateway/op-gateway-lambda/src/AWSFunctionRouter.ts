import { APIGatewayProxyResult } from 'aws-lambda';
import { FunctionRouter } from 'generic-rest-api-router';
import { AwsRequestContext } from './AWSRequestContext';

/**
 * Defines an AWS Lambda REST API and the functions that will be invoked for all matching
 * HTTP methods and paths.  The template variable T refers to the resource being handled
 * by this REST API.
 */
export class AwsFunctionRouter<T> extends FunctionRouter<T, AwsRequestContext> {
  /**
   * Calls the appropriate Handler based on the HTTP method and path found in the
   * requestContext.  Returns the result of the handler execution as an
   * APIGatewayProxyResult.
   *
   * @param requestContext
   * @returns handler result
   */
  async handle(
    requestContext: AwsRequestContext
  ): Promise<APIGatewayProxyResult> {
    const response = await super.handleRequest(requestContext);

    return {
      headers: response.headers,
      statusCode: response.statusCode,
      body: response.body || '',
    };
  }
}
