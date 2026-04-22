import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, Mail, Search } from 'lucide-react';
import { COUNTRIES } from '@/constants/countries';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('');
  const [debunks, setDebunks] = useState(true);
  const [confirmations, setConfirmations] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const toggleCountry = (name: string) => {
    setCountries((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!debunks && !confirmations)) {
      toast({
        title: 'Almost there',
        description: 'Add your email and pick at least one notification type.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Subscribed',
      description: `We'll email ${email} when verified updates appear${
        countries.length ? ` for ${countries.length} selected ${countries.length === 1 ? 'country' : 'countries'}` : ''
      }.`,
    });
    setEmail('');
    setCountries([]);
    setQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Subscribe to Updates
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Get notified only about verified facts, debunks, and confirmations — not rumors.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subscribe-email">Email Address</Label>
            <Input
              id="subscribe-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Notify me about:</div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={debunks} onCheckedChange={(v) => setDebunks(v === true)} />
              <span>
                <span className="font-medium text-success">Debunks</span>
                <span className="text-muted-foreground"> - False rumors exposed</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={confirmations} onCheckedChange={(v) => setConfirmations(v === true)} />
              <span>
                <span className="font-medium text-signal-verified">Confirmations</span>
                <span className="text-muted-foreground"> - Verified facts</span>
              </span>
            </label>
          </div>

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Countries of interest <span className="text-muted-foreground font-normal">(optional)</span>
              </div>
              {countries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCountries([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear ({countries.length})
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search countries…"
                className="pl-8 h-9"
              />
            </div>
            <ScrollArea className="h-48 rounded-md border border-border">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3">
                {filteredCountries.map((c) => (
                  <label
                    key={c.code}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground text-muted-foreground"
                  >
                    <Checkbox
                      checked={countries.includes(c.name)}
                      onCheckedChange={() => toggleCountry(c.name)}
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="col-span-2 text-center text-xs text-muted-foreground py-4">
                    No countries match "{query}"
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <Button type="submit" className="w-full gap-2">
            <Mail className="h-4 w-4" /> Subscribe
          </Button>
          <p className="text-xs text-center text-muted-foreground -mt-2">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
