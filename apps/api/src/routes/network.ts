import type { FastifyPluginAsync } from "fastify";
import { getDb } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { refreshMatches } from "../services/recommendationEngine.js";

export const networkRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/network/matches — get top matches for current user
  app.get("/matches", { preHandler: requireAuth }, async (req, reply) => {
    const db = getDb();
    const { sub } = req.user as { sub: string };

    const { rows } = await db.query(
      `SELECT nm.*, u.name AS matched_name, u.role AS matched_role,
              ep.business_name, ep.industry, ep.stage
       FROM network_matches nm
       JOIN users u ON u.id = nm.matched_user_id
       LEFT JOIN entrepreneur_profiles ep ON ep.user_id = nm.matched_user_id
       WHERE nm.user_id = (SELECT id FROM users WHERE cognito_sub = $1)
       ORDER BY nm.score DESC
       LIMIT 20`,
      [sub]
    );

    return reply.send({ data: rows });
  });

  // POST /api/network/refresh — trigger re-computation of matches
  app.post("/refresh", { preHandler: requireAuth }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    // Fire-and-forget — returns immediately, matches update async
    refreshMatches(sub).catch((err) =>
      console.error("Match refresh failed", err)
    );

    return reply.status(202).send({ message: "Match refresh started" });
  });

  // GET /api/network/outreach/:matchedUserId — generate warm intro template
  app.get(
    "/outreach/:matchedUserId",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { matchedUserId } = req.params as { matchedUserId: string };
      const db = getDb();
      const { sub } = req.user as { sub: string };

      const { rows } = await db.query(
        `SELECT nm.outreach_template
         FROM network_matches nm
         JOIN users u ON u.id = nm.user_id
         WHERE u.cognito_sub = $1 AND nm.matched_user_id = $2`,
        [sub, matchedUserId]
      );

      if (!rows[0]) {
        return reply
          .status(404)
          .send({ error: "Match not found", statusCode: 404 });
      }

      return reply.send({ data: { template: rows[0].outreach_template } });
    }
  );
};
