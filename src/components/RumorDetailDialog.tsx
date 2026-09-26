import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Flame,
  ShieldCheck,
  UserPlus,
  Building2,
  User as UserIcon,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Rumor } from '@/types';
import { IntensityBar } from '@/components/RumorBits';

const inviteCsoSchema = z.object({
  csoName: z.string().trim().min(2, 'CSO name is required').max(200),
  csoEmail: z.string().trim().email('Valid email required').max(320),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

const inviteRespondSchema = z.object({
  partyType: z.enum(['person', 'institution', 'organization']),
  name: z.string().trim().min(2, 'Name is required').max(200),
  role: z.string().trim().max(200).optional().or(z.literal('')),
  affiliation: z.string().trim().max(200).optional().or(z.literal('')),
  jurisdiction: z.string().trim().max(200).optional().or(z.literal('')),
  website: z.string().trim().url('Enter a valid URL').max(500).optional().or(z.literal('')),
  email: z.string().trim().email('Valid email required').max(320),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function topicBadgeColor(topic: string) {
  const map: Record<string, string> = {
    Politics: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
    Health: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    Migration: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    Economy: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    Conflict: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
    Environment: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
    Technology: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  };
  return map[topic] ?? 'bg-secondary text-secondary-foreground border-border';
}

export function RumorDetailDialog({ rumor, onClose }: { rumor: Rumor | null; onClose: () => void }) {
  const [inviteCsoOpen, setInviteCsoOpen] = useState(false);
  const [inviteRespondOpen, setInviteRespondOpen] = useState(false);
  const [feedback, setFeedback] = useState<'relevant' | 'not_relevant' | null>(null);

  if (!rumor) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const isDebunked = rumor.status === 'debunked';
  const isVerifiedTrue = rumor.status === 'verified-true';
  const isResolved = isDebunked || isVerifiedTrue;
  const isViral = rumor.intensity >= 0.75;

  const sendFeedback = (kind: 'relevant' | 'not_relevant') => {
    setFeedback(kind);
    toast.success('Thanks — your feedback was recorded.');
  };

  return (
    <>
      <Dialog open={!!rumor} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              {isResolved ? (
                <span className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full',
                  isDebunked ? 'bg-signal-debunked/15 text-signal-debunked' : 'bg-signal-verified/15 text-signal-verified',
                )}>
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
                  <AlertCircle className="h-4 w-4" />
                </span>
              )}
              <Badge variant="outline" className={cn('font-normal', topicBadgeColor(rumor.topic))}>
                {rumor.topic}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {rumor.subjectCountry || rumor.originCountry}
              </Badge>
              {isViral && !isResolved && (
                <Badge variant="outline" className="font-normal bg-destructive/10 text-destructive border-destructive/30 gap-1">
                  <Flame className="h-3 w-3" /> Viral
                </Badge>
              )}
            </div>
            <DialogTitle className={cn('text-xl leading-tight pt-2', isDebunked && 'line-through text-muted-foreground')}>
              {rumor.title}
            </DialogTitle>
          </DialogHeader>

          {/* Debunked / Verified header card */}
          {isResolved && (rumor.debunkedBy || rumor.verifiedBy) && (
            <div className={cn(
              'rounded-lg border p-3 flex items-center gap-3',
              isDebunked ? 'border-signal-debunked/30 bg-signal-debunked/5' : 'border-signal-verified/30 bg-signal-verified/5',
            )}>
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                isDebunked ? 'bg-signal-debunked/15 text-signal-debunked' : 'bg-signal-verified/15 text-signal-verified',
              )}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  {isDebunked ? 'Debunked by Certified CSO' : 'Verified against primary sources'}
                </div>
                <div className="font-semibold leading-tight">{isDebunked ? rumor.debunkedBy : rumor.verifiedBy}</div>
                <div className="text-xs text-muted-foreground">{rumor.subjectCountry || rumor.originCountry}</div>
              </div>
            </div>
          )}

          {/* Trending intensity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Trending Intensity</span>
              <span className="font-mono font-semibold">{Math.round(rumor.intensity * 100)}%</span>
            </div>
            <IntensityBar rumor={rumor} />
          </div>

          {/* The Claim */}
          <div className="rounded-md border bg-card p-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              The Claim
            </div>
            <p className={cn('text-sm', isDebunked && 'line-through text-muted-foreground')}>
              {rumor.description}
            </p>
          </div>

          {/* The Facts (debunk/verify content) */}
          {(rumor.debunkContent || rumor.verificationContent) && (
            <div className={cn(
              'rounded-md border p-3 space-y-2',
              isDebunked ? 'border-signal-debunked/30 bg-signal-debunked/5' : 'border-signal-verified/30 bg-signal-verified/5',
            )}>
              <div className={cn(
                'text-[11px] font-mono uppercase tracking-wider',
                isDebunked ? 'text-signal-debunked' : 'text-signal-verified',
              )}>
                The Facts
              </div>
              <p className="text-sm">{rumor.debunkContent || rumor.verificationContent}</p>
              {((isDebunked && rumor.debunkSources?.length) || (isVerifiedTrue && rumor.verificationSources?.length)) && (
                <>
                  <div className="text-xs font-medium pt-1">Sources:</div>
                  <ul className="text-xs space-y-0.5">
                    {(isDebunked ? rumor.debunkSources : rumor.verificationSources)?.map((s) => (
                      <li key={s}>
                        <a className="text-primary hover:underline" href={s} target="_blank" rel="noreferrer">
                          ↗ {s}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Action sections — only when not yet resolved */}
          {!isResolved && (
            <>
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-primary text-[11px] font-mono uppercase tracking-wider">
                  <UserPlus className="h-3.5 w-3.5" /> Know a fact-checker?
                </div>
                <p className="text-sm text-muted-foreground">
                  If you know a civil society organization that could verify this claim, invite them to register.
                </p>
                <Button onClick={() => setInviteCsoOpen(true)} className="w-full gap-2">
                  <UserPlus className="h-4 w-4" /> Invite a CSO to Debunk
                </Button>
              </div>

              <div className="rounded-md border border-secondary-foreground/20 bg-secondary/40 p-3 space-y-2">
                <div className="flex items-center gap-2 text-foreground text-[11px] font-mono uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5" /> Is this about someone?
                </div>
                <p className="text-sm text-muted-foreground">
                  If this rumor mentions a specific person, institution, or organization, invite them to respond directly.
                </p>
                <Button onClick={() => setInviteRespondOpen(true)} variant="secondary" className="w-full gap-2">
                  <Building2 className="h-4 w-4" /> Invite to Respond
                </Button>
              </div>

              <div className="rounded-md border border-warning/30 bg-warning/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-warning text-[11px] font-mono uppercase tracking-wider">
                  <AlertCircle className="h-3.5 w-3.5" /> Not Yet Debunked
                </div>
                <p className="text-sm text-muted-foreground">
                  This rumor has not been debunked by a certified CSO. If you represent a civil society organization, you can register to help verify this claim.
                </p>
                <Button asChild variant="outline" className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/csos/register" onClick={onClose}>
                    <ShieldCheck className="h-4 w-4" /> Register as Certified CSO
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Research Feedback */}
          <div className="rounded-md border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <ClipboardCheck className="h-3.5 w-3.5" /> Research Feedback
            </div>
            <p className="text-sm text-muted-foreground">
              Your feedback helps us understand misinformation patterns. Results are kept private and not displayed publicly.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={feedback === 'relevant' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => sendFeedback('relevant')}
                disabled={feedback !== null}
              >
                <ThumbsUp className="h-4 w-4" /> Relevant
              </Button>
              <Button
                variant={feedback === 'not_relevant' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => sendFeedback('not_relevant')}
                disabled={feedback !== null}
              >
                <ThumbsDown className="h-4 w-4" /> Not Relevant
              </Button>
            </div>
          </div>

          {/* Footer dates */}
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
            <span>Submitted: {formatDate(rumor.submittedAt)}</span>
            {isDebunked && rumor.debunkedAt && <span>Debunked by: {formatDate(rumor.debunkedAt)}</span>}
            {isVerifiedTrue && rumor.verifiedAt && <span>Verified: {formatDate(rumor.verifiedAt)}</span>}
          </div>
        </DialogContent>
      </Dialog>

      <InviteCsoDialog
        open={inviteCsoOpen}
        onClose={() => setInviteCsoOpen(false)}
        rumor={rumor}
      />
      <InviteToRespondDialog
        open={inviteRespondOpen}
        onClose={() => setInviteRespondOpen(false)}
        rumor={rumor}
      />
    </>
  );
}

function InviteCsoDialog({
  open,
  onClose,
  rumor,
}: {
  open: boolean;
  onClose: () => void;
  rumor: Rumor;
}) {
  const [csoName, setCsoName] = useState('');
  const [csoEmail, setCsoEmail] = useState('');
  const [message, setMessage] = useState(
    `Hi, I came across this rumor about '${rumor.title}' and thought your organization could help verify it.`,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inviteCsoSchema.safeParse({ csoName, csoEmail, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('rumor_invites').insert({
        rumor_id: rumor.id,
        invitee_email: csoEmail.trim().toLowerCase(),
        invitee_name: csoName.trim(),
        kind: 'cso_debunk',
        message: message.trim() || null,
      });
      if (insertError) throw insertError;

      // Best-effort email — don't fail the flow if email fails
      const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'cso-verification-received',
          recipientEmail: csoEmail.trim().toLowerCase(),
          idempotencyKey: `cso-invite-${rumor.id}-${csoEmail.trim().toLowerCase()}`,
          templateData: {
            csoName: csoName.trim(),
            rumorTitle: rumor.title,
            inviteMessage: message.trim() || undefined,
          },
        },
      });
      if (emailError) console.warn('Email send failed (non-blocking):', emailError);

      toast.success('Invitation sent.');
      setCsoName('');
      setCsoEmail('');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Invite a CSO to Debunk
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Know a fact-checking organization that could verify this claim? Send them an invitation to register.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cso-name">CSO Name *</Label>
            <Input
              id="cso-name"
              placeholder="e.g., FactCheck Georgia"
              value={csoName}
              onChange={(e) => setCsoName(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cso-email">CSO Email *</Label>
            <Input
              id="cso-email"
              type="email"
              placeholder="contact@factcheck.org"
              value={csoEmail}
              onChange={(e) => setCsoEmail(e.target.value)}
              required
              maxLength={320}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cso-message">Personal Message (optional)</Label>
            <Textarea
              id="cso-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PartyType = 'person' | 'institution' | 'organization';

const PARTY_CONFIG: Record<
  PartyType,
  {
    label: string;
    shortLabel: string;
    icon: typeof UserIcon;
    description: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    extraField: { key: 'role' | 'affiliation' | 'jurisdiction'; label: string; placeholder: string; helper?: string };
    websiteLabel?: string;
    defaultMessage: (rumorTitle: string) => string;
  }
> = {
  person: {
    label: 'Person',
    shortLabel: 'Person',
    icon: UserIcon,
    description:
      'Invite the individual mentioned in this rumor to share their side of the story.',
    namePlaceholder: 'e.g., Jane Doe',
    emailPlaceholder: 'jane@example.com',
    extraField: {
      key: 'role',
      label: 'Role / Title (optional)',
      placeholder: 'e.g., Member of Parliament, Journalist',
      helper: 'How they are publicly known.',
    },
    defaultMessage: (t) =>
      `Hello, a rumor titled "${t}" mentions you. We invite you to review it and share your response — on the record or as background.`,
  },
  institution: {
    label: 'Public Institution',
    shortLabel: 'Institution',
    icon: Building2,
    description:
      'Invite a government body, agency or public office to issue an official response.',
    namePlaceholder: 'e.g., Ministry of Health',
    emailPlaceholder: 'press@ministry.gov',
    extraField: {
      key: 'jurisdiction',
      label: 'Jurisdiction / Country (optional)',
      placeholder: 'e.g., Republic of Moldova',
      helper: 'The country or region this institution serves.',
    },
    websiteLabel: 'Official website (optional)',
    defaultMessage: (t) =>
      `Dear team, a rumor titled "${t}" references your institution. We invite an official statement or clarification for the public record.`,
  },
  organization: {
    label: 'Organization',
    shortLabel: 'Org',
    icon: Briefcase,
    description:
      'Invite a company, NGO or other organization to comment on this rumor.',
    namePlaceholder: 'e.g., Acme Corp',
    emailPlaceholder: 'press@acme.com',
    extraField: {
      key: 'affiliation',
      label: 'Sector / Industry (optional)',
      placeholder: 'e.g., NGO, Pharma, Tech',
    },
    websiteLabel: 'Website (optional)',
    defaultMessage: (t) =>
      `Hello, a rumor titled "${t}" mentions your organization. We invite you to provide a response or clarification.`,
  },
};

function InviteToRespondDialog({
  open,
  onClose,
  rumor,
}: {
  open: boolean;
  onClose: () => void;
  rumor: Rumor;
}) {
  const [partyType, setPartyType] = useState<PartyType>('person');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [extra, setExtra] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState(PARTY_CONFIG.person.defaultMessage(rumor.title));
  const [submitting, setSubmitting] = useState(false);

  const config = PARTY_CONFIG[partyType];

  const handlePartyChange = (next: PartyType) => {
    const prevDefault = PARTY_CONFIG[partyType].defaultMessage(rumor.title);
    setPartyType(next);
    setExtra('');
    setWebsite('');
    if (message.trim() === '' || message.trim() === prevDefault.trim()) {
      setMessage(PARTY_CONFIG[next].defaultMessage(rumor.title));
    }
  };

  const kindMap: Record<PartyType, 'person_respond' | 'institution_respond' | 'organization_respond'> = {
    person: 'person_respond',
    institution: 'institution_respond',
    organization: 'organization_respond',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      partyType,
      name,
      email,
      message,
      role: config.extraField.key === 'role' ? extra : '',
      affiliation: config.extraField.key === 'affiliation' ? extra : '',
      jurisdiction: config.extraField.key === 'jurisdiction' ? extra : '',
      website,
    };
    const parsed = inviteRespondSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      const inviteeRole = [
        config.extraField.key === 'role' ? extra : null,
        config.extraField.key === 'affiliation' ? `Sector: ${extra}` : null,
        config.extraField.key === 'jurisdiction' ? `Jurisdiction: ${extra}` : null,
        website ? `Website: ${website}` : null,
      ]
        .filter((v) => v && String(v).trim().length > 2)
        .join(' · ') || null;

      const { error: insertError } = await supabase.from('rumor_invites').insert({
        rumor_id: rumor.id,
        invitee_email: email.trim().toLowerCase(),
        invitee_name: name.trim(),
        invitee_role: inviteeRole,
        kind: kindMap[partyType],
        party_type: partyType,
        message: message.trim() || null,
      });
      if (insertError) throw insertError;

      const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'invite-to-respond',
          recipientEmail: email.trim().toLowerCase(),
          idempotencyKey: `respond-invite-${rumor.id}-${email.trim().toLowerCase()}`,
          templateData: {
            inviteeName: name.trim(),
            partyType,
            partyLabel: config.label,
            rumorTitle: rumor.title,
            inviteMessage: message.trim() || undefined,
            inviteeRole: inviteeRole || undefined,
          },
        },
      });
      if (emailError) console.warn('Email send failed (non-blocking):', emailError);

      toast.success('Invitation sent.');
      setName('');
      setEmail('');
      setExtra('');
      setWebsite('');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  const partyOptions: Array<{ value: PartyType; label: string; icon: typeof UserIcon }> = [
    { value: 'person', label: PARTY_CONFIG.person.shortLabel, icon: PARTY_CONFIG.person.icon },
    { value: 'institution', label: PARTY_CONFIG.institution.shortLabel, icon: PARTY_CONFIG.institution.icon },
    { value: 'organization', label: PARTY_CONFIG.organization.shortLabel, icon: PARTY_CONFIG.organization.icon },
  ];

  const HeaderIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeaderIcon className="h-5 w-5 text-primary" /> Invite {config.label} to Respond
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Party Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {partyOptions.map((opt) => {
                const Icon = opt.icon;
                const active = partyType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePartyChange(opt.value)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary/50',
                    )}
                  >
                    <Icon className="h-4 w-4" /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="respond-name">
              {partyType === 'person' ? 'Full name *' : `${config.label} name *`}
            </Label>
            <Input
              id="respond-name"
              placeholder={config.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="respond-extra">{config.extraField.label}</Label>
            <Input
              id="respond-extra"
              placeholder={config.extraField.placeholder}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              maxLength={200}
            />
            {config.extraField.helper && (
              <p className="text-[11px] text-muted-foreground">{config.extraField.helper}</p>
            )}
          </div>

          {config.websiteLabel && (
            <div className="space-y-1.5">
              <Label htmlFor="respond-website">{config.websiteLabel}</Label>
              <Input
                id="respond-website"
                type="url"
                placeholder="https://example.org"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={500}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="respond-email">
              {partyType === 'person' ? 'Email *' : 'Press / contact email *'}
            </Label>
            <Input
              id="respond-email"
              type="email"
              placeholder={config.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={320}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="respond-message">Message (optional)</Label>
            <Textarea
              id="respond-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeaderIcon className="h-4 w-4" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
