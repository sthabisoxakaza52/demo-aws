import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getDb } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const createProfileSchema = z.object({
  businessName: z.string().min(1).max(255),
  industry: z.string().min(1).max(100),
  stage: z.enum(["idea", "mvp", "seed", "series_a", "growth"]),
  location: z.string().max(255).optional(),
  bio: z.string().max(2000).optional(),
  goals: z.array(z.string()).max(10).default([]),
  seeking: z
    .array(
      z.enum([
        "co_founder",
        "seed_funding",
        "contract_work",
        "mentorship",
        "partnership",
        "hiring",
      ])
    )
    .default([]),
  websiteUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
});

export const userRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/users/me — fetch current user + profile
  app.get("/me", { preHandler: requireAuth }, async (req, reply) => {
    const db = getDb();
    const { sub } = req.user as { sub: string };

    const { rows } = await db.query(
      `SELECT u.*, ep.*
       FROM users u
       LEFT JOIN entrepreneur_profiles ep ON ep.user_id = u.id
       WHERE u.cognito_sub = $1`,
      [sub]
    );

    if (!rows[0]) {
      return reply.status(404).send({ error: "User not found", statusCode: 404 });
    }

    return reply.send({ data: rows[0] });
  });

  // POST /api/users/profile — create or update entrepreneur profile
  app.post("/profile", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }

    const db = getDb();
    const { sub } = req.user as { sub: string };
    const d = parsed.data;

    // Upsert user record (Cognito sub is the source of truth)
    const userResult = await db.query(
      `INSERT INTO users (cognito_sub, email, name, role)
       VALUES ($1, $2, $3, 'entrepreneur')
       ON CONFLICT (cognito_sub) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [sub, (req.user as { email: string }).email, (req.user as { name: string }).name]
    );
    const userId = userResult.rows[0].id as string;

    // Upsert entrepreneur profile
    await db.query(
      `INSERT INTO entrepreneur_profiles
         (user_id, business_name, industry, stage, location, bio, goals, seeking, website_url, linkedin_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (user_id) DO UPDATE SET
         business_name = EXCLUDED.business_name,
         industry      = EXCLUDED.industry,
         stage         = EXCLUDED.stage,
         location      = EXCLUDED.location,
         bio           = EXCLUDED.bio,
         goals         = EXCLUDED.goals,
         seeking       = EXCLUDED.seeking,
         website_url   = EXCLUDED.website_url,
         linkedin_url  = EXCLUDED.linkedin_url,
         updated_at    = NOW()`,
      [
        userId,
        d.businessName,
        d.industry,
        d.stage,
        d.location ?? null,
        d.bio ?? null,
        d.goals,
        d.seeking,
        d.websiteUrl ?? null,
        d.linkedinUrl ?? null,
      ]
    );

    return reply.status(201).send({ data: { userId }, message: "Profile saved" });
  });
};
