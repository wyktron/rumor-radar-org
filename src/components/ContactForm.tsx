import { useMemo, useState, useEffect } from 'react';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ShieldCheck, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(120),
  email: z.string().trim().email('Invalid email').max(320),
  organization: z.string().trim().max(200).optional(),
  subject: z.string().trim().min(3, 'Subject is too short').max(200),
  message: z.string().trim().min(10, 'Message is too short').max(5000),
});

function makeChallenge() {
  const a = Math.floor(Math.random() * 8) + 2; // 2..9
  const b = Math.floor(Math.random() * 8) + 2; // 2..9
  return { a, b, answer: a + b };
}

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // bots fill this
  const [challenge, setChallenge] = useState(() => makeChallenge());
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  // Refresh challenge after a successful send
  useEffect(() => {
    // no-op, kept for clarity
  }, [challenge]);

  const challengePrompt = useMemo(
    () => `What is ${challenge.a} + ${challenge.b}?`,
    [challenge],
  );

  function reset() {
    setName('');
    setEmail('');
    setOrganization('');
    setSubject('');
    setMessage('');
    setHoneypot('');
    setChallengeAnswer('');
    setChallenge(makeChallenge());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Bot trap #1: honeypot must stay empty
    if (honeypot.trim() !== '') {
      toast.success('Message sent'); // pretend success for bots
      reset();
      return;
    }
    // Bot trap #2: too-fast submission (< 3s after mount)
    if (Date.now() - mountedAt < 3000) {
      toast.error('Please take a moment to review your message before sending.');
      return;
    }
    // Bot trap #3: math challenge
    if (Number(challengeAnswer) !== challenge.answer) {
      toast.error('Verification failed', { description: 'Please answer the math question correctly.' });
      setChallenge(makeChallenge());
      setChallengeAnswer('');
      return;
    }

    const parsed = schema.safeParse({ name, email, organization: organization || undefined, subject, message });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? 'Please check the form');
      return;
    }

    setBusy(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization ?? null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    setBusy(false);

    if (error) {
      toast.error('Could not send message', { description: error.message });
      setChallenge(makeChallenge());
      setChallengeAnswer('');
      return;
    }

    toast.success('Message sent', { description: 'We received your message and will reply soon.' });
    reset();
  }

  return (
    <Card className="glass-panel p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Contact us
        </h2>
        <p className="text-sm text-muted-foreground">
          Questions, partnership ideas, or press inquiries — send us a note and we'll get back to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Name *</Label>
            <Input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email *</Label>
            <Input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={320} autoComplete="email" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-org" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Organization</Label>
          <Input id="cf-org" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} autoComplete="organization" placeholder="Optional" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-subject" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Subject *</Label>
          <Input id="cf-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-message" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Message *</Label>
          <Textarea id="cf-message" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={5000} rows={5} />
        </div>

        {/* Honeypot field — hidden from humans, bots fill it */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <Label htmlFor="cf-website">Website</Label>
          <Input
            id="cf-website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {/* Math challenge */}
        <div className="space-y-1.5">
          <Label htmlFor="cf-challenge" className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Verification *
          </Label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground select-none">{challengePrompt}</span>
            <Input
              id="cf-challenge"
              inputMode="numeric"
              pattern="[0-9]*"
              value={challengeAnswer}
              onChange={(e) => setChallengeAnswer(e.target.value)}
              required
              maxLength={3}
              className="w-24"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Quick check to confirm you're human. No tracking.</p>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send message
          </Button>
        </div>
      </form>
    </Card>
  );
}
