import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getDb } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const listQuerySchema = z.object({
  type: z.enum(["job", "rfp", "grant", "investment", "event"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const opportunityRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/opportunities — paginated list with optional type filter
  app.get("/", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query params", statusCode: 400 });
    }

    const { type, page, pageSize } = parsed.data;
    const offset = (page - 1) * pageSize;
    const db = getDb();

    const whereClause = type ? "WHERE type = $3" : "";
    const params: unknown[] = type
      ? [pageSize, offset, type]
      : [pageSize, offset];

    const [dataResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, type, title, description, source_url, company, location, tags, score, posted_at, expires_at
         FROM opportunities
         ${whereClause}
         ORDER BY posted_at DESC
         LIMIT $1 OFFSET $2`,
        params
      ),
      db.query(
        `SELECT COUNT(*) FROM opportunities ${whereClause}`,
        type ? [type] : []
      ),
    ]);

    const total = Number(countResult.rows[0].count);

    return reply.send({
      data: dataResult.rows,
      total,
      page,
      pageSize,
      hasMore: offset + dataResult.rows.length < total,
    });
  });

  // GET /api/opportunities/:id
  app.get("/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = getDb();

    const { rows } = await db.query(
      "SELECT * FROM opportunities WHERE id = $1",
      [id]
    );

    if (!rows[0]) {
      return reply.status(404).send({ error: "Opportunity not found", statusCode: 404 });
    }

    return reply.send({ data: rows[0] });
  });
};
