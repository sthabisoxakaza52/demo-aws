import OpenAI from "openai";
import { getDb } from "../db/client.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates an embedding for a text string using OpenAI.
 */
export const embed = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
};

/**
 * Refreshes network matches for a user using pgvector cosine similarity.
 * Compares the user's profile embedding against all other entrepreneur profiles.
 */
export const refreshMatches = async (cognitoSub: string): Promise<void> => {
  const db = getDb();

  // Get user's profile
  const profileResult = await db.query(
    `SELECT ep.user_id, ep.embedding, ep.bio, ep.goals, ep.business_name, ep.industry
     FROM entrepreneur_profiles ep
     JOIN users u ON u.id = ep.user_id
     WHERE u.cognito_sub = $1`,
    [cognitoSub]
  );

  const profile = profileResult.rows[0];
  if (!profile) return;

  // If no embedding yet, generate one
  if (!profile.embedding) {
    const text = [
      profile.business_name,
      profile.industry,
      profile.bio,
      ...(profile.goals ?? []),
    ]
      .filter(Boolean)
      .join(". ");

    const embedding = await embed(text);

    await db.query(
      "UPDATE entrepreneur_profiles SET embedding = $1 WHERE user_id = $2",
      [`[${embedding.join(",")}]`, profile.user_id]
    );

    profile.embedding = `[${embedding.join(",")}]`;
  }

  // Find top 20 similar profiles using pgvector cosine distance
  const matchResult = await db.query(
    `SELECT ep.user_id,
            1 - (ep.embedding <=> $1::vector) AS score,
            u.name, ep.business_name, ep.industry
     FROM entrepreneur_profiles ep
     JOIN users u ON u.id = ep.user_id
     WHERE ep.user_id != $2
       AND ep.embedding IS NOT NULL
     ORDER BY ep.embedding <=> $1::vector
     LIMIT 20`,
    [profile.embedding, profile.user_id]
  );

  // Upsert matches
  for (const match of matchResult.rows) {
    const reason = `Both working in ${match.industry}. Similar business goals and stage.`;

    // Generate outreach template for top matches (score > 0.7)
    let outreachTemplate: string | null = null;
    if (Number(match.score) > 0.7) {
      outreachTemplate = await generateOutreachTemplate(
        profile.business_name,
        match.business_name,
        reason
      );
    }

    await db.query(
      `INSERT INTO network_matches (user_id, matched_user_id, score, reason, outreach_template)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, matched_user_id) DO UPDATE SET
         score             = EXCLUDED.score,
         reason            = EXCLUDED.reason,
         outreach_template = EXCLUDED.outreach_template,
         created_at        = NOW()`,
      [profile.user_id, match.user_id, match.score, reason, outreachTemplate]
    );
  }
};

/**
 * Generates a personalized warm introduction message using GPT-4o.
 */
const generateOutreachTemplate = async (
  senderBusiness: string,
  targetBusiness: string,
  reason: string
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You write short, warm, professional outreach messages for entrepreneurs. Keep it under 100 words.",
      },
      {
        role: "user",
        content: `Write an outreach message from ${senderBusiness} to ${targetBusiness}. Reason for connecting: ${reason}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  return completion.choices[0]?.message?.content ?? "";
};
