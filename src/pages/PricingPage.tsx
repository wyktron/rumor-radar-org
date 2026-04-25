import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null,
    description: "For exploration and small experiments.",
    features: [
      "1,000 API requests / month",
      "Public rumors only",
      "Community support",
    ],
    cta: "Sign up",
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    priceId: "api_starter_monthly",
    description: "For small projects and prototypes.",
    features: [
      "10,000 API requests / month",
      "Filtered rumor feed",
      "Email support (48h)",
    ],
    cta: "Subscribe",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    priceId: "api_pro_monthly",
    description: "For production apps and newsrooms.",
    features: [
      "100,000 API requests / month",
      "Real-time webhooks",
      "Translations API",
      "Priority email support",
    ],
    cta: "Subscribe",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    priceId: "api_enterprise_monthly",
    description: "For platforms, governments, large NGOs.",
    features: [
      "1,000,000+ requests / month",
      "Dedicated account manager",
      "99.9% SLA",
      "Custom data exports",
    ],
    cta: "Subscribe",
    highlight: false,
  },
] as const;

type Tier = (typeof TIERS)[number];

export default function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [active, setActive] = useState<Tier | null>(null);

  return (
    <>
      <Helmet>
        <title>API Pricing — RumorRadar</title>
        <meta
          name="description"
          content="RumorRadar API pricing — track and respond to disinformation in real time. Free tier available, scaling to enterprise."
        />
        <link rel="canonical" href="https://rumorradar.org/pricing" />
      </Helmet>

      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            API access for the rumor heatmap
          </h1>
          <p className="mt-3 text-muted-foreground">
            Build with the same data feed our fact-checkers use. Free for
            researchers and small teams, with paid tiers for production
            workloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={tier.highlight ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tier.name}</CardTitle>
                  {tier.highlight && <Badge>Most popular</Badge>}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">${tier.price}</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {tier.priceId ? (
                  <Button
                    className="w-full"
                    variant={tier.highlight ? "default" : "outline"}
                    onClick={() => setActive(tier)}
                  >
                    {tier.cta}
                  </Button>
                ) : (
                  <Button asChild className="w-full" variant="outline">
                    <Link to={user ? "/dashboard" : "/login"}>{tier.cta}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Prices in USD. Cancel anytime from the billing portal. Need a custom
          plan?{" "}
          <a className="underline" href="mailto:sales@rumorradar.org">
            Get in touch
          </a>
          .
        </p>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscribe — {active?.name}</DialogTitle>
            <DialogDescription>
              ${active?.price} / month. You can cancel anytime.
            </DialogDescription>
          </DialogHeader>
          <PaymentTestModeBanner />
          {active?.priceId && (
            <StripeEmbeddedCheckout
              priceId={active.priceId}
              customerEmail={user?.email}
              userId={user?.id}
            />
          )}
          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              Tip: <Link to="/login" className="underline">sign in</Link> first
              so we can attach the subscription to your account.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
