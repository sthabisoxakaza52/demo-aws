import OpenAI from "openai";
import { getDb } from "../db/client.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a structured business proposal using GPT-4o.
 * Runs asynchronously — updates the proposal row when complete.
 */
export const generateProposal = async (
  proposalId: string,
  userId: string,
  opportunityId?: string
): Promise<void> => {
  const db = getDb();

  // Gather context
  const [profileResult, opportunityResult] = await Promise.all([
    db.query(
      `SELECT ep.*, u.name
       FROM entrepreneur_profiles ep
       JOIN users u ON u.id = ep.user_id
       WHERE ep.user_id = $1`,
      [userId]
    ),
    opportunityId
      ? db.query("SELECT * FROM opportunities WHERE id = $1", [opportunityId])
      : Promise.resolve({ rows: [] }),
  ]);

  const profile = profileResult.rows[0];
  const opportunity = opportunityResult.rows[0];

  if (!profile) {
    await db.query(
      "UPDATE proposals SET status = 'draft' WHERE id = $1",
      [proposalId]
    );
    return;
  }

  const systemPrompt = `You are an expert business proposal writer helping entrepreneurs 
secure funding, partnerships, and opportunities. Write clear, compelling, and concise proposals.
Always structure output in Markdown with the following sections:
1. Executive Summary
2. Problem & Solution
3. Traction & Metrics
4. The Ask & Use of Funds
5. Team & Credibility`;

  const userPrompt = `Write a business proposal for the following entrepreneur:

**Entrepreneur:** ${profile.name}
**Business:** ${profile.business_name}
**Industry:** ${profile.industry}
**Stage:** ${profile.stage}
**Bio:** ${profile.bio ?? "Not provided"}
**Goals:** ${profile.goals?.join(", ") ?? "Not specified"}
${
  opportunity
    ? `
**Target Opportunity:** ${opportunity.title}
**Opportunity Type:** ${opportunity.type}
**Description:** ${opportunity.description ?? "Not provided"}
`
    : ""
}

Generate a professional, tailored proposal.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? "";

    await db.query(
      "UPDATE proposals SET status = 'ready', content = $1, updated_at = NOW() WHERE id = $2",
      [content, proposalId]
    );
  } catch (err) {
    console.error("OpenAI proposal generation error", err);
    await db.query(
      "UPDATE proposals SET status = 'draft', updated_at = NOW() WHERE id = $1",
      [proposalId]
    );
  }
};
