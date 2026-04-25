// Shared helper for calling Lovable AI Gateway from edge functions.
// Uses tool-calling for structured output.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiToolSchema = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export class AiRateLimitError extends Error {
  constructor() {
    super("AI rate limit exceeded");
    this.name = "AiRateLimitError";
  }
}

export class AiPaymentError extends Error {
  constructor() {
    super("AI credits exhausted");
    this.name = "AiPaymentError";
  }
}

function getApiKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

export async function callAiText(opts: {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
    }),
  });

  if (resp.status === 429) throw new AiRateLimitError();
  if (resp.status === 402) throw new AiPaymentError();
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway error ${resp.status}: ${t}`);
  }

  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export async function callAiStructured<T = Record<string, unknown>>(opts: {
  messages: AiMessage[];
  tool: AiToolSchema;
  model?: string;
  temperature?: number;
}): Promise<T> {
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages: opts.messages,
      temperature: opts.temperature ?? 0.1,
      tools: [
        {
          type: "function",
          function: {
            name: opts.tool.name,
            description: opts.tool.description,
            parameters: opts.tool.parameters,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: opts.tool.name } },
    }),
  });

  if (resp.status === 429) throw new AiRateLimitError();
  if (resp.status === 402) throw new AiPaymentError();
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway error ${resp.status}: ${t}`);
  }

  const json = await resp.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("AI did not return a tool call");
  }
  return JSON.parse(toolCall.function.arguments) as T;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function aiErrorResponse(err: unknown): Response {
  if (err instanceof AiRateLimitError) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded, please try again in a moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (err instanceof AiPaymentError) {
    return new Response(
      JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  console.error("AI error:", err);
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : "Unknown AI error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
