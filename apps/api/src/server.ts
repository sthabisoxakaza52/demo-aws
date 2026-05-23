import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { healthRoutes } from "./routes/health.js";
import { userRoutes } from "./routes/users.js";
import { opportunityRoutes } from "./routes/opportunities.js";
import { proposalRoutes } from "./routes/proposals.js";
import { networkRoutes } from "./routes/network.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(opportunityRoutes, { prefix: "/api/opportunities" });
  await app.register(proposalRoutes, { prefix: "/api/proposals" });
  await app.register(networkRoutes, { prefix: "/api/network" });

  return app;
};

// ── Local dev server ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  const start = async () => {
    const app = await buildApp();
    try {
      await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
