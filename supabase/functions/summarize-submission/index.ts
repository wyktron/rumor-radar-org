// Take a free-form rumor description from a submitter and produce:
// - a clean, neutral title (<= 140 chars)
// - a clean description (<= 600 chars)
// - a suggested topic from a fixed list
// Public endpoint (no auth) — used to assist the SubmitRumorPage UX.

import { callAiStructured, corsHeaders, aiErrorResponse } from "../_shared/ai.ts";

const TOPICS = ["Health", "Politics", "Migration", "Economy", "Conflict", "Environment", "Technology"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { claim, description, originCountry } = await req.json();
    const raw = `${claim ?? ""}\n${description ?? ""}`.trim();
    if (raw.length < 5) {
      return new Response(JSON.stringify({ error: "Provide claim or description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await callAiStructured<{
      title: string;
      description: string;
      topic: typeof TOPICS[number];
      subject_country: string | null;
    }>({
      messages: [
        {
          role: "system",
          content:
            "You help structure user-submitted misinformation reports. Given a raw claim and description, produce: " +
            "1) A neutral, factual title (<= 140 chars) describing the rumor. Do NOT validate or refute — just describe what is being claimed. " +
            "2) A short factual description (<= 600 chars) restating the claim clearly. " +
            "3) A topic from the fixed list. " +
            "4) The country the rumor is ABOUT (if clearly different from origin). Return null if same as origin or unclear.",
        },
        {
          role: "user",
          content: JSON.stringify({ raw, originCountry: originCountry ?? null }),
        },
      ],
      tool: {
        name: "structure_submission",
        description: "Produce a clean, neutral title and metadata for the rumor submission.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 140 },
            description: { type: "string", maxLength: 600 },
            topic: { type: "string", enum: [...TOPICS] },
            subject_country: { type: ["string", "null"] },
          },
          required: ["title", "description", "topic", "subject_country"],
          additionalProperties: false,
        },
      },
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return aiErrorResponse(err);
  }
});
