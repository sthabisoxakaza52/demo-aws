import type { FastifyRequest, FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Validates the Cognito JWT from the Authorization header.
 * Cognito's JWKS endpoint:
 *   https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
 */
const JWKS_URI = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

export const requireAuth = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    reply.status(401).send({ error: "Missing or invalid Authorization header", statusCode: 401 });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    });

    // Attach decoded claims to request for downstream handlers
    req.user = payload;
  } catch (err) {
    req.log.warn({ err }, "JWT verification failed");
    reply.status(401).send({ error: "Invalid or expired token", statusCode: 401 });
  }
};

// Extend Fastify's request type to include user claims
declare module "fastify" {
  interface FastifyRequest {
    user?: Record<string, unknown>;
  }
}
