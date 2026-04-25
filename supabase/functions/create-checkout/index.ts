import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  priceId?: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
  environment?: StripeEnv;
  // Donation flow only:
  donationAmountCents?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Body;
    const env: StripeEnv =
      body.environment === "live" ? "live" : "sandbox";
    const stripe = createStripeClient(env);
    const returnUrl =
      body.returnUrl ||
      `${req.headers.get("origin") ?? "https://rumorradar.org"}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

    let session;

    if (body.donationAmountCents) {
      const amount = Math.floor(Number(body.donationAmountCents));
      if (!Number.isFinite(amount) || amount < 100) {
        return new Response(
          JSON.stringify({ error: "Donation must be at least $1.00" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "RumorRadar — Donation" },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        ui_mode: "embedded",
        return_url: returnUrl,
        ...(body.customerEmail && { customer_email: body.customerEmail }),
        metadata: { kind: "donation" },
      });
    } else {
      if (!body.priceId || !/^[a-zA-Z0-9_-]+$/.test(body.priceId)) {
        return new Response(JSON.stringify({ error: "Invalid priceId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const prices = await stripe.prices.list({ lookup_keys: [body.priceId] });
      if (!prices.data.length) {
        return new Response(JSON.stringify({ error: "Price not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      session = await stripe.checkout.sessions.create({
        line_items: [
          { price: stripePrice.id, quantity: body.quantity || 1 },
        ],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded",
        return_url: returnUrl,
        ...(body.customerEmail && { customer_email: body.customerEmail }),
        ...(body.userId && {
          metadata: { userId: body.userId, priceId: body.priceId },
          ...(isRecurring && {
            subscription_data: {
              metadata: { userId: body.userId, priceId: body.priceId },
            },
          }),
        }),
      });
    }

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-checkout]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
