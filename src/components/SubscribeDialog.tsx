import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, Mail, Search, Loader2 } from 'lucide-react';
import { ALL_COUNTRIES } from '@/constants/all-countries';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailSchema = z.string().trim().email().max(320);

export function SubscribeDialog({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [debunks, setDebunks] = useState(true);
  const [confirmations, setConfirmations] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const toggleCountry = (name: string) => {
    setCountries((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: 'Invalid email', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    if (!debunks && !confirmations) {
      toast({
        title: t('subscribe.almostThere'),
        description: t('subscribe.almostThereDesc'),
        variant: 'destructive',
      });
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: 'Consent required',
        description: 'Please accept the Terms of Service and Privacy Policy to continue.',
        variant: 'destructive',
      });
      return;
    }

    setBusy(true);
    const { error } = await supabase.from('subscribers').insert({
      email: parsed.data.toLowerCase(),
      countries,
      notify_debunks: debunks,
      notify_confirmations: confirmations,
      consented_terms: acceptedTerms,
      consented_privacy: acceptedPrivacy,
      preferred_language: i18n.resolvedLanguage ?? 'en',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
    });
    setBusy(false);

    if (error) {
      const isDuplicate = error.code === '23505' || /duplicate/i.test(error.message);
      toast({
        title: isDuplicate ? 'Already subscribed' : 'Subscription failed',
        description: isDuplicate
          ? 'This email is already in our list. Check your inbox for the confirmation email.'
          : error.message,
        variant: isDuplicate ? 'default' : 'destructive',
      });
      return;
    }

    toast({
      title: 'Check your inbox',
      description: `We sent a confirmation link to ${parsed.data}. Please confirm to activate your subscription.`,
    });
    setEmail('');
    setCountries([]);
    setQuery('');
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('subscribe.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{t('subscribe.info')}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subscribe-email">{t('subscribe.email')}</Label>
            <Input
              id="subscribe-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('subscribe.emailPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t('subscribe.notifyAbout')}</div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={debunks} onCheckedChange={(v) => setDebunks(v === true)} />
              <span>
                <span className="font-medium text-success">{t('subscribe.debunks')}</span>
                <span className="text-muted-foreground"> - {t('subscribe.debunksDesc')}</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={confirmations} onCheckedChange={(v) => setConfirmations(v === true)} />
              <span>
                <span className="font-medium text-signal-verified">{t('subscribe.confirmations')}</span>
                <span className="text-muted-foreground"> - {t('subscribe.confirmationsDesc')}</span>
              </span>
            </label>
          </div>

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {t('subscribe.countries')} <span className="text-muted-foreground font-normal">({t('subscribe.optional')})</span>
              </div>
              {countries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCountries([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('subscribe.clear')} ({countries.length})
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('subscribe.searchCountries')}
                className="pl-8 h-9"
              />
            </div>
            <ScrollArea className="h-40 rounded-md border border-border">
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
                    {t('subscribe.noCountries', { query })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Consent */}
          <div className="space-y-2 rounded-md border border-border bg-secondary/30 p-3">
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <span>
                I agree to the{' '}
                <a href="/about#terms" target="_blank" rel="noreferrer" className="text-primary underline">
                  Terms of Service
                </a>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={acceptedPrivacy}
                onCheckedChange={(v) => setAcceptedPrivacy(v === true)}
                className="mt-0.5"
              />
              <span>
                I have read the{' '}
                <a href="/about#privacy" target="_blank" rel="noreferrer" className="text-primary underline">
                  Privacy Policy
                </a>{' '}
                and consent to receiving emails from Rumor Radar.
              </span>
            </label>
          </div>

          <Button type="submit" disabled={busy} className="w-full gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {t('subscribe.submit')}
          </Button>
          <p className="text-xs text-center text-muted-foreground -mt-2">
            {t('subscribe.privacy')}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
