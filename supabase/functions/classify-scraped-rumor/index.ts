// Take a scraped_rumors entry, run AI classification, and update the row with
// detected_country, topic, ai_summary, ai_confidence, and any obvious duplicate.
// Staff-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { callAiStructured, corsHeaders, aiErrorResponse } from "../_shared/ai.ts";

const TOPICS = ["Health", "Politics", "Migration", "Economy", "Conflict", "Environment", "Technology"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isStaff } = await adminClient.rpc("is_staff", { _user_id: userData.user.id });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Staff role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { scrapedId } = await req.json();
    if (!scrapedId || typeof scrapedId !== "string") {
      return new Response(JSON.stringify({ error: "scrapedId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: scraped, error: scrapedErr } = await adminClient
      .from("scraped_rumors")
      .select("id, title, raw_text, source_url, source_language")
      .eq("id", scrapedId)
      .single();

    if (scrapedErr || !scraped) {
      return new Response(JSON.stringify({ error: "Scraped rumor not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull a small set of recent existing rumor titles for duplicate-spotting.
    const { data: recentRumors } = await adminClient
      .from("rumors")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(50);

    const result = await callAiStructured<{
      title: string;
      summary: string;
      topic: typeof TOPICS[number];
      detected_country: string | null;
      confidence: number;
      duplicate_of: string | null;
    }>({
      messages: [
        {
          role: "system",
          content:
            "You classify scraped misinformation candidates. Produce a clean neutral title, a 2-sentence summary, a topic, the country mainly concerned, a confidence score (0-1) for whether this is a real misinformation claim worth reviewing, and the ID of an existing rumor it duplicates if any (else null).",
        },
        {
          role: "user",
          content: JSON.stringify({
            scraped: {
              title: scraped.title,
              raw_text: scraped.raw_text,
              source_url: scraped.source_url,
              source_language: scraped.source_language,
            },
            existing_rumors: (recentRumors ?? []).map((r) => ({ id: r.id, title: r.title })),
          }),
        },
      ],
      tool: {
        name: "classify_scraped_rumor",
        description: "Classify the scraped item",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            topic: { type: "string", enum: [...TOPICS] },
            detected_country: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            duplicate_of: { type: ["string", "null"] },
          },
          required: ["title", "summary", "topic", "detected_country", "confidence", "duplicate_of"],
          additionalProperties: false,
        },
      },
    });

    const update: Record<string, unknown> = {
      title: result.title || scraped.title,
      ai_summary: result.summary,
      topic: result.topic,
      detected_country: result.detected_country,
      ai_confidence: result.confidence,
      status: result.duplicate_of ? "duplicate" : "reviewing",
      updated_at: new Date().toISOString(),
    };
    if (result.duplicate_of) update.duplicate_of = result.duplicate_of;

    await adminClient.from("scraped_rumors").update(update).eq("id", scraped.id);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return aiErrorResponse(err);
  }
});
