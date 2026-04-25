import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  return clientToken?.startsWith("pk_test_") ? "sandbox" : "live";
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      throw new Error("Payments are not configured (missing VITE_PAYMENTS_CLIENT_TOKEN).");
    }
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function isPaymentsConfigured(): boolean {
  return Boolean(clientToken);
}
