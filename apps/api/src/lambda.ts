/**
 * AWS Lambda entrypoint.
 * Wraps the Fastify app with @fastify/aws-lambda so it can be invoked
 * by API Gateway (HTTP API proxy integration).
 */
import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "./server.js";

const app = await buildApp();

/**
 * Export the proxy directly as the Lambda handler.
 * @fastify/aws-lambda handles caching internally across warm invocations.
 */
export const handler = awsLambdaFastify(app);
