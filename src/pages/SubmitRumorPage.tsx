import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { ALL_COUNTRIES } from '@/constants/all-countries';
import { toast } from 'sonner';
import { Send, MapPin, Info, Crosshair, Loader2, Sparkles } from 'lucide-react';
import type { Topic } from '@/types';

// NOTE: We intentionally do NOT auto-select a country from coordinates.
// Reverse-geocoding small or disputed regions to a sovereign country is
// error-prone and politically sensitive — the user must pick the country
// themselves. We only show the raw coordinates they marked.

const schema = z.object({
  claim: z.string().trim().min(8, 'Claim must be at least 8 characters').max(280),
  description: z.string().trim().max(1000).optional(),
  originCountry: z.string().min(1, 'Select where you first heard the rumor'),
  subjectCountry: z.string().optional(),
  topic: z.string().min(1, 'Select a topic'),
  source: z.string().trim().max(120).optional(),
});

const NONE = '__none__';

export default function SubmitRumorPage() {
  const { submitRumor } = useApp();
  const { t } = useTranslation();
  const nav = useNavigate();
  const location = useLocation();
  const pickedCoords = (location.state as { originCoordinates?: [number, number] } | null)?.originCoordinates;

  const [form, setForm] = useState({
    claim: '',
    description: '',
    originCountry: '',
    subjectCountry: '',
    topic: '',
    source: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  async function handleAiAssist() {
    if (!form.claim.trim() && !form.description.trim()) {
      toast.error('Write a claim or description first');
      return;
    }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-submission', {
        body: {
          claim: form.claim,
          description: form.description,
          originCountry: form.originCountry,
        },
      });
      if (error) throw error;
      setForm((f) => ({
        ...f,
        claim: data.title || f.claim,
        description: data.description || f.description,
        topic: data.topic || f.topic,
        subjectCountry: data.subject_country || f.subjectCountry,
      }));
      toast.success('AI cleaned up your submission');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'AI assist failed';
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  }

  // If user navigates here directly without picking, send them back to the map to pick a spot
  useEffect(() => {
    if (!pickedCoords) {
      toast.info(t('submit.pickFirst'));
      nav('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coordLabel = useMemo(
    () => pickedCoords ? `${pickedCoords[0].toFixed(2)}°, ${pickedCoords[1].toFixed(2)}°` : '',
    [pickedCoords],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    const origin = ALL_COUNTRIES.find((c) => c.name === form.originCountry);
    const mappedOrigin = COUNTRIES.find((c) => c.name === form.originCountry);
    const coords = pickedCoords ?? mappedOrigin?.coordinates ?? [0, 0];

    setBusy(true);
    const { error } = await supabase.from('rumor_submissions').insert({
      claim: form.claim,
      description: form.description || null,
      origin_country: form.originCountry,
      origin_country_code: origin?.code ?? null,
      origin_latitude: coords[0],
      origin_longitude: coords[1],
      subject_country: form.subjectCountry || null,
      topic: form.topic,
      source: form.source || null,
      source_language: 'en',
    });
    // Mirror locally for the in-app moderator dashboard view
    submitRumor({
      claim: form.claim,
      description: form.description || undefined,
      originCountry: form.originCountry,
      originCoordinates: coords,
      subjectCountry: form.subjectCountry || undefined,
      topic: form.topic as Topic,
      source: form.source || undefined,
    });
    setBusy(false);
    if (error) {
      toast.error('Submission failed', { description: error.message });
      return;
    }
    toast.success(t('submit.received'), { description: t('submit.receivedDesc') });
    nav('/timeline');
  }

  return (
    <div className="container py-8 max-w-xl space-y-4">
      <Card className="glass-panel p-4 border-success/40 bg-success/5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/15 text-success shrink-0">
            <Crosshair className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-success">{t('submit.locationCaptured', { defaultValue: 'Location captured' })}</div>
            <div className="text-sm font-semibold mt-0.5 font-mono">{coordLabel || '—'}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t('submit.pickedHint', { defaultValue: 'Pick the country below — we don\'t guess it for you.' })}</div>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => nav('/')}>
            <MapPin className="h-3.5 w-3.5" /> {t('submit.changeSpot')}
          </Button>
        </div>
      </Card>

      <Card className="glass-panel p-4 border-primary/30">
        <div className="flex gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {t('submit.intro')}
          </p>
        </div>
      </Card>

      <Card className="glass-panel p-6 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-1">{t('submit.anonEnc')}</div>
          <h1 className="text-2xl font-bold">{t('submit.title')}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('submit.claim')} error={errors.claim}>
            <Input
              value={form.claim}
              onChange={(e) => setForm({ ...form, claim: e.target.value })}
              placeholder={t('submit.claimPh')}
              maxLength={280}
            />
          </Field>
          <Field label={t('submit.description')} error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('submit.descriptionPh')}
              rows={4}
              maxLength={1000}
            />
          </Field>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={aiBusy}
            onClick={handleAiAssist}
            className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10"
          >
            {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI clean-up & auto-fill
          </Button>

          <Field
            label={t('submit.origin')}
            hint={t('submit.originHint')}
            error={errors.originCountry}
          >
            <Select
              value={form.originCountry}
              onValueChange={(v) => setForm({ ...form, originCountry: v })}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder={t('submit.selectOrigin')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={t('submit.subject')}
            hint={t('submit.subjectHint')}
            error={errors.subjectCountry}
          >
            <Select
              value={form.subjectCountry || NONE}
              onValueChange={(v) => setForm({ ...form, subjectCountry: v === NONE ? '' : v })}
            >
              <SelectTrigger><SelectValue placeholder={t('submit.sameAsOrigin')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('submit.sameAsOrigin')}</SelectItem>
                {ALL_COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('submit.topic')} error={errors.topic}>
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                <SelectTrigger><SelectValue placeholder={t('submit.select')} /></SelectTrigger>
                <SelectContent>
                  {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('submit.sourceChannel')} error={errors.source}>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder={t('submit.sourcePh')}
                maxLength={120}
              />
            </Field>
          </div>

          <Button type="submit" disabled={busy} className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {t('submit.transmit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground -mt-1">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
