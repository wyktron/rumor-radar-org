import { useState } from "react";
import { Heart, Bitcoin, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { isPaymentsConfigured } from "@/lib/stripe";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [5, 25, 100, 500] as const;
const BTC_ADDRESS = "bc1qexamplebtcdonationaddressreplaceme00000";

export function DonationDialog({ open, onOpenChange }: DonationDialogProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<number>(25);
  const [custom, setCustom] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);

  const amount = custom ? Math.max(1, Math.floor(Number(custom) || 0)) : selected;
  const amountCents = amount * 100;

  function reset() {
    setShowCheckout(false);
    setCustom("");
    setSelected(25);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Support RumorRadar
          </DialogTitle>
          <DialogDescription>
            We're an independent, non-profit project. Your donation funds
            translation, fact-checker stipends, and the team that calls back
            worried families.
          </DialogDescription>
        </DialogHeader>

        <PaymentTestModeBanner />

        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card">
              <Wallet className="h-4 w-4 mr-1.5" /> Card
            </TabsTrigger>
            <TabsTrigger value="btc">
              <Bitcoin className="h-4 w-4 mr-1.5" /> Bitcoin
            </TabsTrigger>
            <TabsTrigger value="paypal" disabled>
              PayPal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            {!isPaymentsConfigured() ? (
              <p className="text-sm text-muted-foreground p-4 border rounded-md">
                Card payments aren't configured yet. Please try again shortly.
              </p>
            ) : !showCheckout ? (
              <>
                <div>
                  <Label className="text-sm">Choose an amount (USD)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {PRESET_AMOUNTS.map((a) => (
                      <Button
                        key={a}
                        type="button"
                        variant={selected === a && !custom ? "default" : "outline"}
                        onClick={() => {
                          setSelected(a);
                          setCustom("");
                        }}
                      >
                        ${a}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="custom-amount" className="text-sm">
                    Or enter a custom amount
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="custom-amount"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Other amount"
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={amount < 1}
                  onClick={() => setShowCheckout(true)}
                >
                  Donate ${amount}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment via Stripe. We never see your card details.
                </p>
              </>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mb-2"
                >
                  ← Change amount
                </button>
                <StripeEmbeddedCheckout
                  donationAmountCents={amountCents}
                  customerEmail={user?.email}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="btc" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send BTC to the address below. Once confirmed on-chain, drop us
              an email at{" "}
              <a className="underline" href="mailto:donate@rumorradar.org">
                donate@rumorradar.org
              </a>{" "}
              and we'll send a thank-you receipt.
            </p>
            <div className={cn("rounded-md border bg-muted/40 p-3 font-mono text-xs break-all")}>
              {BTC_ADDRESS}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(BTC_ADDRESS)}
            >
              Copy address
            </Button>
          </TabsContent>

          <TabsContent value="paypal">
            <p className="text-sm text-muted-foreground p-4 border rounded-md">
              PayPal donations are coming soon. For now, please use card or
              Bitcoin.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
