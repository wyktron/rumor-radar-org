import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeEmbeddedCheckoutProps {
  priceId?: string;
  donationAmountCents?: number;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout(props: StripeEmbeddedCheckoutProps) {
  const stripePromise = useMemo(() => getStripe(), []);

  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        const { data, error } = await supabase.functions.invoke(
          "create-checkout",
          {
            body: {
              priceId: props.priceId,
              donationAmountCents: props.donationAmountCents,
              quantity: props.quantity,
              customerEmail: props.customerEmail,
              userId: props.userId,
              returnUrl:
                props.returnUrl ||
                `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
              environment: getStripeEnvironment(),
            },
          },
        );
        if (error || !data?.clientSecret) {
          throw new Error(error?.message || "Failed to create checkout session");
        }
        return data.clientSecret;
      },
    }),
    // We intentionally re-create options whenever the underlying inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.priceId,
      props.donationAmountCents,
      props.quantity,
      props.customerEmail,
      props.userId,
      props.returnUrl,
    ],
  );

  return (
    <div id="checkout" className="min-h-[480px]">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
