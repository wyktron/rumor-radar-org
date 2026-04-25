const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full bg-warning/15 border-b border-warning/40 px-4 py-2 text-center text-xs text-warning-foreground">
      <span className="font-medium">Test mode</span> — payments in the preview
      use Stripe's test environment. No real charge will be made.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Learn more
      </a>
    </div>
  );
}
