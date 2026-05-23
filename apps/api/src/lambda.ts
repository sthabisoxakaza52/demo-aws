/**
 * AWS Lambda entrypoint.
 * Wraps the Fastify app with @fastify/aws-lambda so it can be invoked
 * by API Gateway (HTTP API proxy integration).
 */
import awsLambdaFastify from "@fastify/aws-lambda";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { buildApp } from "./server.js";

// Cache the proxy across warm Lambda invocations
let proxy: ReturnType<typeof awsLambdaFastify> | null = null;

const getProxy = async () => {
  if (!proxy) {
    const app = await buildApp();
    proxy = awsLambdaFastify(app);
  }
  return proxy;
};

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
) => {
  const p = await getProxy();
  return p(event, context);
};
