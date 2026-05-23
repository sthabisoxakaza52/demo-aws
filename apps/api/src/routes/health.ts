import type { FastifyPluginAsync } from "fastify";
import { getDb } from "../db/client.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (_req, reply) => {
    try {
      await getDb().query("SELECT 1");
      return reply.send({ status: "ok", db: "connected" });
    } catch {
      return reply.status(503).send({ status: "error", db: "unreachable" });
    }
  });
};
