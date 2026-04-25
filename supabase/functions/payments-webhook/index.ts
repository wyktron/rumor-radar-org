import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  createStripeClient,
  getWebhookSecret,
} from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const env: StripeEnv = url.searchParams.get("env") === "live" ? "live" : "sandbox";

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = createStripeClient(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      getWebhookSecret(env),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature";
    console.error("[payments-webhook] signature verification failed:", msg);
    return new Response(`Webhook signature failed: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Record<string, unknown>;
        const metadata = (s.metadata ?? {}) as Record<string, string>;
        if (metadata.kind === "donation") {
          await supabase.from("donations").insert({
            amount_cents: Number(s.amount_total ?? 0),
            currency: String(s.currency ?? "usd").toUpperCase(),
            donor_email: s.customer_email as string | null,
            provider: "stripe",
            provider_payment_id: String(s.id),
            status: "completed",
            raw_payload: s,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Record<string, unknown>;
        const meta = (sub.metadata ?? {}) as Record<string, string>;
        const items = (sub.items as { data?: Array<{ price?: { id?: string; product?: string; lookup_key?: string } }> })?.data ?? [];
        const firstItem = items[0]?.price;
        const periodEnd = (sub.current_period_end as number | undefined) ?? null;

        await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: meta.userId || null,
              stripe_customer_id: String(sub.customer ?? ""),
              stripe_subscription_id: String(sub.id),
              status: String(sub.status ?? "unknown"),
              price_id: firstItem?.lookup_key || meta.priceId || null,
              product_id: firstItem?.product || null,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: Boolean(sub.cancel_at_period_end),
              environment: env,
              metadata: meta,
            },
            { onConflict: "stripe_subscription_id" },
          );
        break;
      }
      default:
        console.log("[payments-webhook] unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[payments-webhook] handler error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "handler error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
