import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, AlertTriangle, ShieldCheck, Phone, MessageSquare, Mail, Loader2 } from 'lucide-react';
import { COUNTRIES } from '@/constants/countries';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LovedOneContactMethod, LovedOneCallTime } from '@/types';

interface Props {
  trigger?: React.ReactNode;
}

export function HelpLovedOneDialog({ trigger }: Props) {
  const { addLovedOneSubmission } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<LovedOneContactMethod>('phone');
  const [contactValue, setContactValue] = useState('');
  const [bestTime, setBestTime] = useState<LovedOneCallTime>('anytime');
  const [country, setCountry] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');

  const selectedCountry = useMemo(() => COUNTRIES.find((c) => c.name === country), [country]);

  // Foreign-number detection: only meaningful for phone/sms
  const isForeignNumber = useMemo(() => {
    if (method === 'email' || !selectedCountry || !contactValue.trim()) return false;
    const digits = contactValue.replace(/[^\d+]/g, '');
    if (!digits.startsWith('+')) return false; // can't tell without prefix
    return !digits.startsWith(selectedCountry.phonePrefix);
  }, [method, contactValue, selectedCountry]);

  const isEmailMethod = method === 'email';

  function reset() {
    setMethod('phone');
    setContactValue('');
    setBestTime('anytime');
    setCountry('');
    setRelationship('');
    setNotes('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactValue.trim() || !country || !relationship.trim() || !notes.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setBusy(true);
    const countryRow = COUNTRIES.find((c) => c.name === country);
    const { error } = await supabase.from('loved_one_submissions').insert({
      contact_method: method,
      contact_value: contactValue.trim(),
      best_time_to_call: method === 'phone' ? bestTime : null,
      country,
      country_code: countryRow?.code ?? null,
      relationship: relationship.trim(),
      notes: notes.trim(),
    });
    // Mirror locally so the moderator dashboard (still localStorage-backed in this batch) shows it
    addLovedOneSubmission({
      contactMethod: method,
      contactValue: contactValue.trim(),
      bestTimeToCall: method === 'phone' ? bestTime : undefined,
      country,
      relationship: relationship.trim(),
      notes: notes.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error('Submission failed', { description: error.message });
      return;
    }
    toast.success('Outreach request received', {
      description: 'Our team will reach out with verified information.',
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
            <Heart className="h-4 w-4 fill-destructive text-destructive" /> Help a loved one
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Help a loved one
          </DialogTitle>
          <DialogDescription>
            Submit contact info for someone you care about who may be exposed to misinformation. Our team will reach out with verified, fact-checked information.
          </DialogDescription>
        </DialogHeader>

        {/* Anti-abuse warning */}
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 flex gap-2.5">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">For legitimate outreach only.</p>
            <p className="text-muted-foreground">
              This is not for harassment, pranks, or unsolicited marketing. Submissions are reviewed and abuse will result in IP bans and potential legal action.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact method */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Contact method *</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as LovedOneContactMethod)}
              className="grid grid-cols-3 gap-2"
            >
              {([
                { v: 'phone', icon: Phone, label: 'Phone call' },
                { v: 'sms', icon: MessageSquare, label: 'SMS' },
                { v: 'email', icon: Mail, label: 'Email' },
              ] as const).map(({ v, icon: Icon, label }) => (
                <Label
                  key={v}
                  htmlFor={`m-${v}`}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2.5 cursor-pointer transition-colors ${
                    method === v ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40'
                  }`}
                >
                  <RadioGroupItem id={`m-${v}`} value={v} className="sr-only" />
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Contact value */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {isEmailMethod ? 'Email address *' : 'Phone number *'}
            </Label>
            <Input
              type={isEmailMethod ? 'email' : 'tel'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={isEmailMethod ? 'their.email@example.com' : '+40 700 000 000'}
              required
            />
            {!isEmailMethod && (
              <p className="text-[11px] text-muted-foreground">
                Include the international prefix (e.g. +40, +1) so we can detect the country.
              </p>
            )}
          </div>

          {/* Best time to call (phone only) */}
          {method === 'phone' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Best time to call</Label>
              <Select value={bestTime} onValueChange={(v) => setBestTime(v as LovedOneCallTime)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8–12)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12–17)</SelectItem>
                  <SelectItem value="evening">Evening (17–21)</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Country */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Their country *</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.name}>
                    {c.name} ({c.phonePrefix})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isForeignNumber && (
              <div className="rounded-md border border-warning/40 bg-warning/10 p-2.5 flex gap-2 mt-2">
                <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                <p className="text-xs">
                  Our hotline can only reach numbers from <strong>{selectedCountry?.name}</strong>. Consider using <strong>email</strong> instead.
                </p>
              </div>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Relationship *</Label>
            <Input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Father, Mother, Friend, Aunt"
              required
              maxLength={60}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">What misinformation? *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Briefly describe what they believe (e.g. 'Believes vaccines contain microchips')"
              rows={3}
              required
              maxLength={500}
            />
          </div>

          <div className="rounded-md border border-success/30 bg-success/5 p-2.5 flex gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
            <p>Their info is confidential and used only for this outreach. We never share it with third parties.</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
              Submit outreach
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
