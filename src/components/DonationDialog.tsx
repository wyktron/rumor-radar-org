import { useState } from "react";
import { Heart, Bitcoin, Zap, Copy, Check, ShieldCheck, FileText, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const XMR_ADDRESS =
  "42tSSXU6jA489k733nDdtLXPkp31owRwGUHgArJWwadq5SRkVDPjUjwPWoKydVkMHrWhov4GT5PRx2QzGXh8wk9x9kuD3rP";
const XMR_URI = `monero:${XMR_ADDRESS}`;
const BTC_STANDARD = "bc1q8qu6n2776j3ytx98ffhhy6ejay8cuhujgrjy7z";
const BTC_PAYJOIN =
  "bitcoin:bc1q8qu6n2776j3ytx98ffhhy6ejay8cuhujgrjy7z?pjos=0&pj=https%3A%2F%2Fpayjo.in%2FEW0HD7LX36GSC%23RK1QFLS8X3RV9VZ7QUG6TWPMGCUMVE4UN8MV5ZGP3PVZA5SD42Q5L3F6%2BOH1QYPFLM8XL59R0XV4VGPLS7FRDSSM4TUXL07TXCWC4S0GLVLNK2SE4NQ%2BEX1MT0766G";

export function DonationDialog({ open, onOpenChange }: DonationDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the address manually.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setShowTerms(false); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showTerms ? (
              <>
                <FileText className="h-5 w-5 text-primary" />
                Donation Terms
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 text-destructive" />
                Support RumorRadar
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showTerms
              ? "Please read these terms before sending any donation."
              : "We're an independent, non-profit project. Your donation funds translation, fact-checker stipends, and the team that calls back worried families. We accept crypto only — no middlemen, no fees siphoned off."}
          </DialogDescription>
        </DialogHeader>

        {showTerms ? (
          <div className="space-y-4 text-sm">
            <ul className="space-y-3 text-muted-foreground list-disc pl-5">
              <li>
                <span className="text-foreground font-medium">No refunds.</span>{" "}
                Cryptocurrency donations are final and irreversible. We cannot
                reverse, refund, or recover sent transactions for any reason.
              </li>
              <li>
                <span className="text-foreground font-medium">Voluntary gift.</span>{" "}
                Donations are voluntary contributions, not payments for goods
                or services. You receive no product, license, or guarantee in
                exchange.
              </li>
              <li>
                <span className="text-foreground font-medium">No tax receipts.</span>{" "}
                We are not a registered 501(c)(3) or equivalent charity in
                most jurisdictions. Donations are generally not tax-deductible.
              </li>
              <li>
                <span className="text-foreground font-medium">Send the right asset.</span>{" "}
                Only send XMR to the Monero address and BTC to the Bitcoin
                address. Funds sent on the wrong network or to the wrong
                address are permanently lost.
              </li>
              <li>
                <span className="text-foreground font-medium">Your responsibility.</span>{" "}
                You are solely responsible for the legality of your donation
                in your jurisdiction and for the security of your own wallet.
              </li>
              <li>
                <span className="text-foreground font-medium">Editorial independence.</span>{" "}
                Donations do not buy influence. Donors have no control over
                editorial decisions, debunks, or which rumors we investigate.
              </li>
              <li>
                <span className="text-foreground font-medium">Privacy.</span>{" "}
                We do not collect personal data through the donation flow
                itself. If you email us for a thank-you note, we keep that
                correspondence private.
              </li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowTerms(false)}
            >
              <ArrowLeft className="h-4 w-4" /> Back to donation
            </Button>
          </div>
        ) : (
        <>

        <Tabs defaultValue="monero" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monero">
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Monero
            </TabsTrigger>
            <TabsTrigger value="standard">
              <Bitcoin className="h-4 w-4 mr-1.5" /> BTC
            </TabsTrigger>
            <TabsTrigger value="payjoin">
              <Zap className="h-4 w-4 mr-1.5" /> PayJoin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monero" className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Preferred
              </Badge>
              <span className="text-xs text-muted-foreground">
                Strongest privacy for both of us
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Send XMR to the address below. Monero transactions are private
              by default — neither the amount nor the sender is visible
              on-chain.
            </p>
            <div
              className={cn(
                "rounded-md border bg-muted/40 p-3 font-mono text-[10px] leading-relaxed break-all select-all",
              )}
            >
              {XMR_ADDRESS}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => copy(XMR_ADDRESS, "Monero address")}
              >
                {copied === "Monero address" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "Monero address" ? "Copied" : "Copy address"}
              </Button>
              <Button asChild size="sm" className="gap-2">
                <a href={XMR_URI}>
                  <ShieldCheck className="h-4 w-4" /> Open in wallet
                </a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="standard" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send BTC to the address below from any wallet.
            </p>
            <div
              className={cn(
                "rounded-md border bg-muted/40 p-3 font-mono text-xs break-all select-all",
              )}
            >
              {BTC_STANDARD}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => copy(BTC_STANDARD, "BTC address")}
            >
              {copied === "BTC address" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "BTC address" ? "Copied" : "Copy address"}
            </Button>
          </TabsContent>

          <TabsContent value="payjoin" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              PayJoin improves on-chain privacy for both of us. Open this
              link in a PayJoin-compatible wallet (e.g. BlueWallet, Wasabi,
              Sparrow).
            </p>
            <div
              className={cn(
                "rounded-md border bg-muted/40 p-3 font-mono text-[10px] leading-relaxed break-all select-all",
              )}
            >
              {BTC_PAYJOIN}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => copy(BTC_PAYJOIN, "PayJoin URI")}
              >
                {copied === "PayJoin URI" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "PayJoin URI" ? "Copied" : "Copy URI"}
              </Button>
              <Button asChild size="sm" className="gap-2">
                <a href={BTC_PAYJOIN}>
                  <Zap className="h-4 w-4" /> Open in wallet
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Once your transaction confirms, drop us a note at{" "}
            <a className="underline" href="mailto:donate@rumorradar.org">
              donate@rumorradar.org
            </a>{" "}
            and we'll send a thank-you receipt.
          </p>
          <p className="text-xs text-muted-foreground text-center">
            By donating you agree to our{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="underline hover:text-foreground transition-colors"
            >
              donation terms
            </button>
            .
          </p>
        </div>
        </>
        )}
      </DialogContent>

    </Dialog>
  );
}
