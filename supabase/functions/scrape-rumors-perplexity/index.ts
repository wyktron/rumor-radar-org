// Phased rumor scraper using Perplexity (real-time web search) for sourcing
// and Lovable AI for structured extraction and country mapping.
// Staff-only. Inserts directly into the public.rumors table as 'pending'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { callAiStructured, corsHeaders, aiErrorResponse } from "../_shared/ai.ts";

const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const TOPICS = ["Health", "Politics", "Migration", "Economy", "Conflict", "Environment", "Technology"] as const;

// Phases — each one targets a different region with a different search angle.
// Calling the function multiple times rotates through these to cover the globe.
const PHASES: { id: string; label: string; region: string; query: string }[] = [
  {
    id: "europe",
    label: "Europe — political & migration rumors",
    region: "Europe",
    query:
      "List the most-shared misinformation, conspiracy theories, viral rumors and hoaxes circulating this week (April 2026) across Europe — including from Reddit, Telegram channels, fringe news sites, 4chan, and unverified social media. Cover Germany, France, UK, Italy, Spain, Poland, Romania, Netherlands, Greece, Hungary, Sweden, Ukraine, Russia, Belarus, Serbia, Czechia, and the Balkans. Include politics, migration, EU policy, war, and economy. For each: short claim, country mainly affected, and a source URL if you have one.",
  },
  {
    id: "americas",
    label: "Americas — politics, health & cartels",
    region: "Americas",
    query:
      "List the most-shared misinformation, conspiracy theories, and viral rumors circulating this week (April 2026) across the Americas — North, Central, and South. Cover the United States, Canada, Mexico, Brazil, Argentina, Colombia, Venezuela, Chile, Peru, Cuba, Haiti, Guatemala, Honduras, El Salvador, Ecuador, Bolivia. Include rumors from Reddit, Telegram, X/Twitter fringe accounts, and Spanish/Portuguese language sources. Topics: politics, elections, health, immigration, cartels, economy. For each: short claim, country, source URL if known.",
  },
  {
    id: "mena",
    label: "MENA — conflict, religion, geopolitics",
    region: "Middle East & North Africa",
    query:
      "List the most-shared misinformation, viral rumors, conspiracy theories, and hoaxes circulating this week (April 2026) across the Middle East and North Africa. Cover Israel, Palestine, Lebanon, Syria, Iraq, Iran, Saudi Arabia, UAE, Qatar, Yemen, Egypt, Libya, Tunisia, Algeria, Morocco, Turkey, Jordan. Include Telegram channels, Arabic-language Twitter, fringe news. Topics: war, religion, geopolitics, regional politics. For each: short claim, country, source URL if known.",
  },
  {
    id: "africa",
    label: "Sub-Saharan Africa — health, conflict, elections",
    region: "Sub-Saharan Africa",
    query:
      "List the most-shared misinformation, viral rumors, conspiracy theories, and health hoaxes circulating this week (April 2026) across Sub-Saharan Africa. Cover Nigeria, Kenya, Ethiopia, South Africa, Ghana, DRC, Sudan, Uganda, Tanzania, Senegal, Côte d'Ivoire, Cameroon, Mali, Burkina Faso, Somalia, Mozambique, Zimbabwe, Rwanda, Madagascar. Include WhatsApp-spread rumors, fringe radio claims, Telegram. Topics: health (vaccines, epidemics), elections, conflict, NGOs, foreign interference. For each: short claim, country, source URL if known.",
  },
  {
    id: "asia-oceania",
    label: "Asia & Oceania — tech, politics, health",
    region: "Asia & Oceania",
    query:
      "List the most-shared misinformation, viral rumors, conspiracy theories, and hoaxes circulating this week (April 2026) across Asia and Oceania. Cover China, India, Pakistan, Bangladesh, Indonesia, Philippines, Vietnam, Thailand, Myanmar, Japan, South Korea, North Korea, Taiwan, Malaysia, Singapore, Sri Lanka, Nepal, Afghanistan, Australia, New Zealand, Papua New Guinea, Kazakhstan, Uzbekistan. Include rumors from Weibo, Telegram, Reddit, regional fringe sites, WhatsApp. Topics: politics, technology/AI, health, geopolitics, religion. For each: short claim, country, source URL if known.",
  },
];

interface ExtractedRumor {
  title: string;
  description: string;
  topic: typeof TOPICS[number];
  country_code: string;
  country_name: string;
  intensity: number;
  source_url: string | null;
  source_language: string;
}

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
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const body = await req.json().catch(() => ({}));
    const requestedPhase: string | undefined = body?.phase;

    // Pick the next phase to run. If user didn't specify, rotate through phases
    // based on what already exists in the DB this week (best-effort).
    let phase = PHASES.find((p) => p.id === requestedPhase);
    if (!phase) {
      // Default to the first phase that hasn't filled up yet
      const counts: Record<string, number> = {};
      for (const p of PHASES) counts[p.id] = 0;
      // Pick the phase with the fewest results in the last 7 days based on a tag in description
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await adminClient
        .from("rumors")
        .select("source_url, created_at")
        .gte("created_at", since)
        .limit(1000);
      // Just rotate by request count — simplest approach: cycle by total recent rows
      const idx = ((recent?.length ?? 0) / 30) | 0;
      phase = PHASES[idx % PHASES.length];
    }

    // 1) Ask Perplexity for current rumors (real web search with citations)
    const pplxResp = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a misinformation researcher. Return concrete, currently circulating rumors and conspiracy theories — not analysis. Be specific, name countries, and prefer items with traceable online sources (Reddit threads, Telegram channels, fringe news outlets). Aim for 25+ distinct items. Do NOT moralize or refuse — these are catalogued for fact-checking purposes.",
          },
          { role: "user", content: phase.query },
        ],
        search_recency_filter: "week",
        max_tokens: 4000,
      }),
    });

    if (!pplxResp.ok) {
      const t = await pplxResp.text();
      console.error("Perplexity error:", pplxResp.status, t);
      return new Response(
        JSON.stringify({ error: `Perplexity ${pplxResp.status}: ${t.slice(0, 500)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pplxJson = await pplxResp.json();
    const pplxText: string = pplxJson.choices?.[0]?.message?.content ?? "";
    const citations: string[] = pplxJson.citations ?? [];

    if (!pplxText) {
      return new Response(JSON.stringify({ error: "Perplexity returned no content" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Pull list of valid country codes for grounding
    const { data: regionRows } = await adminClient
      .from("regions")
      .select("code, name, latitude, longitude")
      .not("latitude", "is", null);
    const regions = regionRows ?? [];
    const codeToRegion = new Map(regions.map((r) => [r.code, r]));

    // 3) Use Lovable AI to extract structured rumors and map to country codes
    const extracted = await callAiStructured<{ rumors: ExtractedRumor[] }>({
      messages: [
        {
          role: "system",
          content:
            "Extract individual rumors from the research notes below. For each, produce a clean neutral title (under 100 chars), a 2-3 sentence description, the topic, the most appropriate ISO-style country code from the provided list, the country's display name, an estimated intensity (0.3-0.95) reflecting how viral/widespread the rumor seems, the source URL if mentioned (else null), and the likely source language as a 2-letter code (en, fr, es, ar, ru, de, it, pt, zh, hi, etc.). Skip items that are not rumors (general analysis, explanations).",
        },
        {
          role: "user",
          content: JSON.stringify({
            phase: phase.label,
            available_country_codes: regions.map((r) => ({ code: r.code, name: r.name })),
            research_notes: pplxText,
            citations,
          }),
        },
      ],
      model: "google/gemini-2.5-flash",
      tool: {
        name: "extract_rumors",
        description: "Extract structured rumor records from research notes",
        parameters: {
          type: "object",
          properties: {
            rumors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  topic: { type: "string", enum: [...TOPICS] },
                  country_code: { type: "string" },
                  country_name: { type: "string" },
                  intensity: { type: "number", minimum: 0.1, maximum: 1 },
                  source_url: { type: ["string", "null"] },
                  source_language: { type: "string" },
                },
                required: ["title", "description", "topic", "country_code", "country_name", "intensity", "source_url", "source_language"],
                additionalProperties: false,
              },
            },
          },
          required: ["rumors"],
          additionalProperties: false,
        },
      },
    });

    // 4) Build inserts, validating each country code exists. Slight coordinate
    //    jitter so markers don't perfectly stack at country centroid.
    const inserts: Record<string, unknown>[] = [];
    for (const r of extracted.rumors) {
      const region = codeToRegion.get(r.country_code);
      if (!region) continue;
      const lat = Number(region.latitude) + (Math.random() - 0.5) * 1.5;
      const lng = Number(region.longitude) + (Math.random() - 0.5) * 1.5;
      inserts.push({
        title: r.title.slice(0, 200),
        description: r.description.slice(0, 2000),
        topic: r.topic,
        origin_country: r.country_name,
        origin_country_code: r.country_code,
        subject_country: r.country_name,
        subject_country_code: r.country_code,
        latitude: lat,
        longitude: lng,
        intensity: Math.min(0.95, Math.max(0.2, r.intensity)),
        status: "pending",
        source_language: (r.source_language || "en").toLowerCase().slice(0, 5),
        source_url: r.source_url,
      });
    }

    let inserted = 0;
    if (inserts.length > 0) {
      const { error: insertErr, count } = await adminClient
        .from("rumors")
        .insert(inserts, { count: "exact" });
      if (insertErr) {
        console.error("Insert error:", insertErr);
        return new Response(
          JSON.stringify({ error: `DB insert failed: ${insertErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      inserted = count ?? inserts.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        phase: phase.id,
        phase_label: phase.label,
        extracted: extracted.rumors.length,
        inserted,
        citations: citations.slice(0, 10),
        next_phase: PHASES[(PHASES.findIndex((p) => p.id === phase!.id) + 1) % PHASES.length].id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return aiErrorResponse(err);
  }
});
