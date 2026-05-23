import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getDb } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { generateProposal } from "../services/proposalGenerator.js";

const createProposalSchema = z.object({
  title: z.string().min(1).max(500),
  opportunityId: z.string().uuid().optional(),
});

export const proposalRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/proposals — list user's proposals
  app.get("/", { preHandler: requireAuth }, async (req, reply) => {
    const db = getDb();
    const { sub } = req.user as { sub: string };

    const { rows } = await db.query(
      `SELECT p.*
       FROM proposals p
       JOIN users u ON u.id = p.user_id
       WHERE u.cognito_sub = $1
       ORDER BY p.created_at DESC`,
      [sub]
    );

    return reply.send({ data: rows });
  });

  // POST /api/proposals — create and trigger AI generation
  app.post("/", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }

    const db = getDb();
    const { sub } = req.user as { sub: string };

    // Resolve user id
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [sub]
    );
    if (!userResult.rows[0]) {
      return reply.status(404).send({ error: "User not found", statusCode: 404 });
    }
    const userId = userResult.rows[0].id as string;

    // Insert proposal in "generating" state
    const { rows } = await db.query(
      `INSERT INTO proposals (user_id, opportunity_id, title, status)
       VALUES ($1, $2, $3, 'generating')
       RETURNING *`,
      [userId, parsed.data.opportunityId ?? null, parsed.data.title]
    );
    const proposal = rows[0];

    // Kick off async generation (fire-and-forget in Lambda context)
    generateProposal(proposal.id, userId, parsed.data.opportunityId).catch(
      (err) => console.error("Proposal generation failed", err)
    );

    return reply.status(202).send({
      data: proposal,
      message: "Proposal generation started",
    });
  });

  // GET /api/proposals/:id
  app.get("/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const { sub } = req.user as { sub: string };

    const { rows } = await db.query(
      `SELECT p.*
       FROM proposals p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND u.cognito_sub = $2`,
      [id, sub]
    );

    if (!rows[0]) {
      return reply.status(404).send({ error: "Proposal not found", statusCode: 404 });
    }

    return reply.send({ data: rows[0] });
  });
};
