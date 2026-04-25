import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Thank you — RumorRadar";
    const t = setTimeout(() => setReady(true), 1500);
    return () => {
      clearTimeout(t);
      document.title = prev;
    };
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            {ready ? (
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            ) : (
              <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
            )}
            <CardTitle className="mt-3">
              {ready ? "Thank you!" : "Finalising…"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {ready
                ? "Your payment was received. A receipt has been emailed to you."
                : "We're confirming your payment with our payment provider."}
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground font-mono break-all">
                Ref: {sessionId}
              </p>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button asChild variant="outline">
                <Link to="/">Back to map</Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
