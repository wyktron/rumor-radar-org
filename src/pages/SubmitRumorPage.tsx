import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { toast } from 'sonner';
import { Send, MapPin, Info, Crosshair } from 'lucide-react';
import type { Topic } from '@/types';

function nearestCountry(lat: number, lng: number): string {
  let best = COUNTRIES[0];
  let bestDist = Infinity;
  for (const c of COUNTRIES) {
    const dLat = c.coordinates[0] - lat;
    const dLng = c.coordinates[1] - lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best.name;
}

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
  const nav = useNavigate();
  const location = useLocation();
  const pickedCoords = (location.state as { originCoordinates?: [number, number] } | null)?.originCoordinates;

  const [form, setForm] = useState({
    claim: '',
    description: '',
    originCountry: pickedCoords ? nearestCountry(pickedCoords[0], pickedCoords[1]) : '',
    subjectCountry: '',
    topic: '',
    source: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If user navigates here directly without picking, send them back to the map to pick a spot
  useEffect(() => {
    if (!pickedCoords) {
      toast.info('Pick the spot on the map where you heard the rumor first.');
      nav('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coordLabel = useMemo(
    () => pickedCoords ? `${pickedCoords[0].toFixed(2)}°, ${pickedCoords[1].toFixed(2)}°` : '',
    [pickedCoords],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    const origin = COUNTRIES.find((c) => c.name === form.originCountry);
    submitRumor({
      claim: form.claim,
      description: form.description || undefined,
      originCountry: form.originCountry,
      originCoordinates: pickedCoords ?? origin?.coordinates ?? [0, 0],
      subjectCountry: form.subjectCountry || undefined,
      topic: form.topic as Topic,
      source: form.source || undefined,
    });
    toast.success('Submission received', { description: 'A moderator will review it shortly.' });
    nav('/timeline');
  }

  return (
    <div className="container py-8 max-w-xl space-y-4">
      <Card className="glass-panel p-5 border-primary/30">
        <div className="flex gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-foreground">How to submit a rumor</h3>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Mark where you heard the rumor</strong> — not where the events
              are taking place. This helps us track how misinformation spreads geographically.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Heard it online?</strong> Pick the capital of the country where
              the platform / news agency is registered. You can mention what country the rumor is <em>about</em> in
              the next field.
            </p>
            <p className="text-muted-foreground text-xs">Your submission will be reviewed by our team before appearing on the map.</p>
          </div>
        </div>
      </Card>

      <Card className="glass-panel p-6 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-1">Anonymous · encrypted</div>
          <h1 className="text-2xl font-bold">Submit a rumor</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Claim *" error={errors.claim}>
            <Input
              value={form.claim}
              onChange={(e) => setForm({ ...form, claim: e.target.value })}
              placeholder="e.g. Government to seize bank deposits overnight"
              maxLength={280}
            />
          </Field>
          <Field label="Description (optional)" error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional context — exact wording, screenshots you saw, etc."
              rows={4}
              maxLength={1000}
            />
          </Field>

          <Field
            label="Origin country *"
            hint="Where YOU heard the rumor. For online sources, use the country where the platform/agency is registered."
            error={errors.originCountry}
          >
            <Select
              value={form.originCountry}
              onValueChange={(v) => setForm({ ...form, originCountry: v })}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Select country of origin" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Subject country (optional)"
            hint="What country is the rumor ABOUT? Leave empty if the same as origin."
            error={errors.subjectCountry}
          >
            <Select
              value={form.subjectCountry || NONE}
              onValueChange={(v) => setForm({ ...form, subjectCountry: v === NONE ? '' : v })}
            >
              <SelectTrigger><SelectValue placeholder="Same as origin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Same as origin</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Topic *" error={errors.topic}>
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source channel (optional)" error={errors.source}>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="WhatsApp, Telegram, X…"
                maxLength={120}
              />
            </Field>
          </div>

          <Button type="submit" className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
            <Send className="h-3.5 w-3.5" /> Transmit submission
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
