import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Send } from 'lucide-react';
import type { Topic } from '@/types';

const schema = z.object({
  claim: z.string().trim().min(8, 'Claim must be at least 8 characters').max(280),
  description: z.string().trim().max(1000).optional(),
  location: z.string().min(1, 'Select a country'),
  topic: z.string().min(1, 'Select a topic'),
  source: z.string().trim().max(120).optional(),
});

export default function SubmitRumorPage() {
  const { submitRumor } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ claim: '', description: '', location: '', topic: '', source: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    const country = COUNTRIES.find((c) => c.name === form.location);
    submitRumor({
      claim: form.claim,
      description: form.description || undefined,
      location: form.location,
      coordinates: country?.coordinates ?? [0, 0],
      topic: form.topic as Topic,
      source: form.source || undefined,
    });
    toast.success('Submission received', { description: 'A moderator will review it shortly.' });
    nav('/timeline');
  }

  return (
    <div className="container py-8 max-w-xl">
      <Card className="glass-panel p-6 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-1">Anonymous · encrypted</div>
          <h1 className="text-2xl font-bold">Submit a rumor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Help the network track suspicious claims. Submissions are anonymous and reviewed by moderators before publishing.
          </p>
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
              placeholder="Where did you see this? Any additional context."
              rows={4}
              maxLength={1000}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country *" error={errors.location}>
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Topic *" error={errors.topic}>
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Source (optional)" error={errors.source}>
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="WhatsApp, Telegram, Twitter/X, TikTok…"
              maxLength={120}
            />
          </Field>
          <Button type="submit" className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
            <Send className="h-3.5 w-3.5" /> Transmit submission
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
