import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart, AlertTriangle, ShieldCheck, Phone, MessageSquare, Mail, Loader2, BadgeCheck, IdCard,
} from 'lucide-react';
import { COUNTRIES } from '@/constants/countries';
import { ALL_COUNTRIES } from '@/constants/all-countries';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LovedOneContactMethod, LovedOneCallTime } from '@/types';

type IdMethod = 'eu_wallet' | 'national_eid' | 'document_selfie';

const ID_METHODS: { value: IdMethod; title: string; detail: string }[] = [
  {
    value: 'eu_wallet',
    title: 'EU Digital Identity Wallet',
    detail: 'Regulation (EU) 2024/1183 — highest assurance, no documents stored by us.',
  },
  {
    value: 'national_eid',
    title: 'National eID (eIDAS)',
    detail: 'Notified national scheme at assurance level substantial or high (Reg. (EU) 910/2014).',
  },
  {
    value: 'document_selfie',
    title: 'ID document + liveness check',
    detail: 'Passport, national ID card or residence permit checked against a live selfie.',
  },
];

export default function HelpLovedOnePage() {
  const [params] = useSearchParams();
  const referral = params.get('ref') ?? '';

  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'identity' | 'request'>('identity');

  // Identity
  const [idMethod, setIdMethod] = useState<IdMethod>('eu_wallet');
  const [fullName, setFullName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [docType, setDocType] = useState('national_id');
  const [docCountry, setDocCountry] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Request
  const [method, setMethod] = useState<LovedOneContactMethod>('phone');
  const [contactValue, setContactValue] = useState('');
  const [bestTime, setBestTime] = useState<LovedOneCallTime>('anytime');
  const [country, setCountry] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const selectedCountry = useMemo(() => COUNTRIES.find((c) => c.name === country), [country]);
  const isEmailMethod = method === 'email';

  const isForeignNumber = useMemo(() => {
    if (isEmailMethod || !selectedCountry || !contactValue.trim()) return false;
    const digits = contactValue.replace(/[^\d+]/g, '');
    if (!digits.startsWith('+')) return false;
    return !digits.startsWith(selectedCountry.phonePrefix);
  }, [isEmailMethod, contactValue, selectedCountry]);

  async function runVerification() {
    if (!fullName.trim() || !requesterEmail.trim()) {
      toast.error('Enter your full legal name and email as they appear on your ID');
      return;
    }
    if (idMethod === 'document_selfie' && (!docCountry || docNumber.trim().length < 5)) {
      toast.error('Select the issuing country and enter your document number');
      return;
    }
    setVerifying(true);
    // Demo environment: the eIDAS / EUDI Wallet handshake is simulated.
    await new Promise((r) => setTimeout(r, 1400));
    setVerifying(false);
    setVerified(true);
    setStep('request');
    toast.success('Identity verified', { description: 'You can now place the outreach request.' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verified) {
      toast.error('Please complete identity verification first');
      return;
    }
    if (!contactValue.trim() || !country || !relationship.trim() || !notes.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!consent || !privacy) {
      toast.error('Both consent confirmations are required');
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
      submitter_email: requesterEmail.trim().toLowerCase(),
      requester_full_name: fullName.trim(),
      requester_email: requesterEmail.trim().toLowerCase(),
      requester_phone: requesterPhone.trim() || null,
      referral_code: referral || null,
      id_verification_method: idMethod,
      id_document_type: idMethod === 'document_selfie' ? docType : null,
      id_document_country: idMethod === 'document_selfie' ? docCountry : null,
      id_document_last4: idMethod === 'document_selfie' ? docNumber.trim().slice(-4) : null,
      id_verification_status: 'verified',
      id_verified_at: new Date().toISOString(),
      consent_permission: consent,
      consent_privacy: privacy,
    });
    setBusy(false);
    if (error) {
      toast.error('Submission failed', { description: error.message });
      return;
    }
    toast.success('Outreach request received', {
      description: 'Our team reviews every request before any call is made.',
    });
    setContactValue('');
    setRelationship('');
    setNotes('');
    setConsent(false);
    setPrivacy(false);
  }

  return (
    <div className="container max-w-3xl py-8 space-y-5">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Heart className="h-6 w-6 text-primary" /> Help a loved one
        </h1>
        <p className="text-sm text-muted-foreground">
          Request a one-off, fact-checked conversation for someone you care about. Access is by
          invitation: the link is sent only to people who have used our hotline.
        </p>
      </div>

      {referral && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
          <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
          <span>
            Invitation reference <strong className="font-mono">{referral}</strong> recognised. Your request
            will be linked to this hotline call.
          </span>
        </div>
      )}

      <div className="rounded-md border border-warning/40 bg-warning/5 p-3 flex gap-2.5">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">For legitimate outreach only.</p>
          <p className="text-muted-foreground">
            Identity verification is mandatory to prevent harassment, pranks and unsolicited contact.
            Abuse leads to account blocking and, where applicable, referral to authorities.
          </p>
        </div>
      </div>

      {/* Step 1 — identity verification */}
      <Card className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IdCard className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Step 1 — Verify your identity</h2>
          </div>
          {verified && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>

        {!verified && (
          <>
            <p className="text-xs text-muted-foreground">
              We verify the person placing the request, not the person being contacted. Choose a method
              aligned with EU electronic identification standards.
            </p>

            <RadioGroup
              value={idMethod}
              onValueChange={(v) => setIdMethod(v as IdMethod)}
              className="grid gap-2 sm:grid-cols-3"
            >
              {ID_METHODS.map((m) => (
                <Label
                  key={m.value}
                  htmlFor={`id-${m.value}`}
                  className={`flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors ${
                    idMethod === m.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40'
                  }`}
                >
                  <RadioGroupItem id={`id-${m.value}`} value={m.value} className="sr-only" />
                  <span className="text-xs font-semibold">{m.title}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{m.detail}</span>
                </Label>
              ))}
            </RadioGroup>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Full legal name *
                </Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As shown on your ID" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Your email *
                </Label>
                <Input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Your phone (optional)
                </Label>
                <Input value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} placeholder="+40 700 000 000" />
              </div>

              {idMethod === 'document_selfie' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Document type *
                    </Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="residence_permit">Residence permit</SelectItem>
                        <SelectItem value="driving_licence">Driving licence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Issuing country *
                    </Label>
                    <Select value={docCountry} onValueChange={setDocCountry}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {ALL_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Document number *
                    </Label>
                    <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Document number" />
                    <p className="text-[11px] text-muted-foreground">
                      Only the last four characters are retained (data minimisation, GDPR Art. 5(1)(c)).
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button onClick={runVerification} disabled={verifying} className="gap-1.5">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {verifying ? 'Verifying identity…' : 'Verify my identity'}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Demo environment: the identity handshake is simulated for the hackathon. In production it
              runs through a qualified eIDAS trust service provider.
            </p>
          </>
        )}

        {verified && (
          <p className="text-xs text-muted-foreground">
            Verified as <strong className="text-foreground">{fullName}</strong> ({requesterEmail}) via{' '}
            {ID_METHODS.find((m) => m.value === idMethod)?.title}.
          </p>
        )}
      </Card>

      {/* Step 2 — the request */}
      <Card className={`glass-panel p-4 space-y-4 ${step === 'identity' && !verified ? 'opacity-60' : ''}`}>
        <h2 className="text-sm font-semibold">Step 2 — Who should we reach out to?</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={!verified} className="space-y-4">
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
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2.5 transition-colors ${
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

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {isEmailMethod ? 'Their email address *' : 'Their phone number *'}
              </Label>
              <Input
                type={isEmailMethod ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={isEmailMethod ? 'their.email@example.com' : '+40 700 000 000'}
              />
            </div>

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

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Their country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name} ({c.phonePrefix})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isForeignNumber && (
                <div className="mt-2 flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <p className="text-xs">
                    Our hotline can only reach numbers from <strong>{selectedCountry?.name}</strong>. Consider{' '}
                    <strong>email</strong> instead.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Relationship *</Label>
              <Input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Father, Mother, Friend, Aunt"
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">What misinformation? *</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe what they believe"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* EU data protection */}
            <div className="space-y-2 rounded-md border border-success/30 bg-success/5 p-3 text-xs">
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Data protection notice (EU GDPR)</p>
                  <p className="text-muted-foreground">
                    You are sharing another person's personal data. Under Regulation (EU) 2016/679 we may only
                    contact them with a lawful basis (Art. 6) and must tell them how we obtained their details
                    (Art. 14). The data is used solely for one-off fact-checking outreach, never for marketing,
                    never shared with third parties, and erased on request (Art. 17). They may object at any
                    time (Art. 21). Your identity data is processed for abuse prevention and kept separately.
                  </p>
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-background/60 p-2.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="leading-snug">
                  I confirm I have this person's explicit permission to share their phone number, email address
                  and other personal data with Rumor Radar for this outreach. *
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-background/60 p-2.5">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="leading-snug">
                  I have read the{' '}
                  <Link to="/legal" className="text-primary underline">privacy policy</Link> and consent to my
                  identity data being processed to prevent misuse of this service. *
                </span>
              </label>
            </div>

            <Button type="submit" disabled={busy || !verified} className="gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              Submit outreach request
            </Button>
          </fieldset>
        </form>
      </Card>
    </div>
  );
}
