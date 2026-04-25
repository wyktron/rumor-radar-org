// Translate a rumor (title, description, debunk_content, verification_content)
// into all supported languages and persist to rumor_translations.
// Staff-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { callAiStructured, corsHeaders, aiErrorResponse } from "../_shared/ai.ts";

const TARGET_LANGUAGES = ["en", "fr", "es", "ar", "ru"] as const;
type Lang = typeof TARGET_LANGUAGES[number];

const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  ru: "Russian",
};

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

    const { rumorId } = await req.json();
    if (!rumorId || typeof rumorId !== "string") {
      return new Response(JSON.stringify({ error: "rumorId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rumor, error: rumorErr } = await adminClient
      .from("rumors")
      .select("id, title, description, debunk_content, verification_content, source_language")
      .eq("id", rumorId)
      .single();

    if (rumorErr || !rumor) {
      return new Response(JSON.stringify({ error: "Rumor not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceLang = (rumor.source_language as Lang) ?? "en";
    const targets = TARGET_LANGUAGES.filter((l) => l !== sourceLang);

    const translations: Array<{ language: Lang; title: string; description: string; debunk_content?: string; verification_content?: string }> = [];

    for (const lang of targets) {
      const result = await callAiStructured<{
        title: string;
        description: string;
        debunk_content?: string;
        verification_content?: string;
      }>({
        messages: [
          {
            role: "system",
            content:
              "You are a precise translator. Translate fact-check content from " +
              LANG_NAMES[sourceLang] +
              " to " +
              LANG_NAMES[lang] +
              ". Preserve meaning exactly. Do not add commentary. Keep proper names. For debunk/verification content, preserve URLs verbatim.",
          },
          {
            role: "user",
            content: JSON.stringify({
              title: rumor.title,
              description: rumor.description,
              debunk_content: rumor.debunk_content ?? null,
              verification_content: rumor.verification_content ?? null,
            }),
          },
        ],
        tool: {
          name: "save_translation",
          description: "Return the translated fields",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              debunk_content: { type: "string" },
              verification_content: { type: "string" },
            },
            required: ["title", "description"],
            additionalProperties: false,
          },
        },
      });

      translations.push({ language: lang, ...result });
    }

    // Upsert translations
    for (const t of translations) {
      await adminClient
        .from("rumor_translations")
        .upsert(
          {
            rumor_id: rumor.id,
            language: t.language,
            title: t.title,
            description: t.description,
            debunk_content: t.debunk_content || null,
            verification_content: t.verification_content || null,
            is_machine_translated: true,
            translated_at: new Date().toISOString(),
          },
          { onConflict: "rumor_id,language" },
        );
    }

    return new Response(
      JSON.stringify({ success: true, languages: translations.map((t) => t.language) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return aiErrorResponse(err);
  }
});
