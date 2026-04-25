import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Loader2, FileText, ShieldCheck, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COUNTRIES } from '@/constants/countries';
import { ALL_COUNTRIES } from '@/constants/all-countries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const optionalUrl = z.string().trim().url().max(500).optional().or(z.literal(''));

const schema = z.object({
  organizationName: z.string().trim().min(2).max(200),
  legalName: z.string().trim().min(2).max(200),
  registrationNumber: z.string().trim().min(1).max(120),
  country: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(200),
  contactEmail: z.string().trim().email().max(320),
  contactPhone: z.string().trim().max(60).optional().or(z.literal('')),
  website: z.string().trim().url().max(500),
  description: z.string().trim().min(20).max(5000),
  missionStatement: z.string().trim().max(2000).optional().or(z.literal('')),
  yearsActive: z.coerce.number().int().min(0).max(500).optional().or(z.literal('' as never)),
  staffCount: z.coerce.number().int().min(0).max(100000).optional().or(z.literal('' as never)),
  ifcnSignatory: z.boolean().default(false),
  methodologyUrl: optionalUrl,
  correctionsPolicyUrl: optionalUrl,
  fundingDisclosureUrl: optionalUrl,
  ownershipDisclosureUrl: optionalUrl,
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the verification terms.' }),
  }),
});

/** Required document slots — applicant MUST attach one file for each. */
const REQUIRED_DOCS = [
  {
    id: 'registration_certificate',
    label: 'Legal registration / incorporation certificate',
    hint: 'Official document from your country\'s NGO, charity, or company registry proving your organization legally exists.',
  },
  {
    id: 'proof_of_address',
    label: 'Proof of organization address',
    hint: 'Recent utility bill, bank statement, lease, or government letter (within last 3 months) showing the organization\'s registered address.',
  },
  {
    id: 'representative_id',
    label: 'Government-issued ID of contact person',
    hint: 'Passport, national ID, or driver\'s license of the person submitting this application. Used only to verify you are authorized.',
  },
] as const;

/** Optional document slots — useful but not strictly required (URL alternative often available). */
const OPTIONAL_DOCS = [
  { id: 'methodology', label: 'Fact-checking methodology document' },
  { id: 'corrections_policy', label: 'Corrections policy document' },
  { id: 'funding_disclosure', label: 'Funding & ownership disclosure' },
  { id: 'staff_list', label: 'Staff / masthead list with bios' },
  { id: 'editorial_charter', label: 'Editorial independence charter' },
  { id: 'other', label: 'Other supporting document' },
] as const;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx';

interface SlotFile {
  file: File;
}
interface OptionalFile {
  file: File;
  docType: string;
}

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CSORegistrationForm({ onSuccess, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  // Required slots keyed by doc id.
  const [requiredFiles, setRequiredFiles] = useState<Record<string, SlotFile | undefined>>({});
  const [optionalFiles, setOptionalFiles] = useState<OptionalFile[]>([]);
  const [form, setForm] = useState({
    organizationName: '',
    legalName: '',
    registrationNumber: '',
    country: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    missionStatement: '',
    yearsActive: '',
    staffCount: '',
    ifcnSignatory: false,
    methodologyUrl: '',
    correctionsPolicyUrl: '',
    fundingDisclosureUrl: '',
    ownershipDisclosureUrl: '',
    consent: false,
  });

  function setRequiredFile(docId: string, file: File | null) {
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error(`${file.name} is too large (max 25 MB).`);
      return;
    }
    setRequiredFiles((prev) => ({ ...prev, [docId]: file ? { file } : undefined }));
  }

  function addOptional(file: File, docType: string) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`${file.name} is too large (max 25 MB).`);
      return;
    }
    setOptionalFiles((prev) => [...prev, { file, docType }]);
  }

  function removeOptional(index: number) {
    setOptionalFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        toast.error(first?.message ?? 'Please complete all required fields');
        setSubmitting(false);
        return;
      }

      // Enforce that every required slot has a file.
      const missing = REQUIRED_DOCS.filter((d) => !requiredFiles[d.id]);
      if (missing.length > 0) {
        toast.error(`Please attach: ${missing.map((d) => d.label).join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Methodology, corrections, funding/ownership: require either a URL or an attached file.
      const hasMethodology =
        form.methodologyUrl.trim() ||
        optionalFiles.some((f) => f.docType === 'methodology');
      const hasCorrections =
        form.correctionsPolicyUrl.trim() ||
        optionalFiles.some((f) => f.docType === 'corrections_policy');
      const hasFunding =
        form.fundingDisclosureUrl.trim() ||
        form.ownershipDisclosureUrl.trim() ||
        optionalFiles.some((f) => f.docType === 'funding_disclosure');
      if (!hasMethodology) {
        toast.error('Provide a methodology URL or upload a methodology document.');
        setSubmitting(false);
        return;
      }
      if (!hasCorrections) {
        toast.error('Provide a corrections policy URL or upload a corrections policy document.');
        setSubmitting(false);
        return;
      }
      if (!hasFunding) {
        toast.error('Provide a funding/ownership URL or upload a disclosure document.');
        setSubmitting(false);
        return;
      }

      const data = parsed.data;
      const country =
        ALL_COUNTRIES.find((c) => c.name === data.country) ??
        COUNTRIES.find((c) => c.name === data.country);

      const { data: insertData, error: insertError } = await supabase
        .from('cso_verification_requests')
        .insert({
          organization_name: data.organizationName,
          legal_name: data.legalName,
          registration_number: data.registrationNumber,
          country: data.country,
          country_code: country?.code ?? null,
          contact_name: data.contactName,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone || null,
          website: data.website,
          description: data.description,
          mission_statement: data.missionStatement || null,
          years_active: typeof data.yearsActive === 'number' ? data.yearsActive : null,
          staff_count: typeof data.staffCount === 'number' ? data.staffCount : null,
          ifcn_signatory: data.ifcnSignatory,
          methodology_url: data.methodologyUrl || null,
          corrections_policy_url: data.correctionsPolicyUrl || null,
          funding_disclosure_url: data.fundingDisclosureUrl || null,
          ownership_disclosure_url: data.ownershipDisclosureUrl || null,
        })
        .select('id')
        .single();

      if (insertError || !insertData) {
        console.error('CSO insert failed', insertError);
        toast.error('Could not submit request. Please try again.');
        setSubmitting(false);
        return;
      }

      const requestId = insertData.id;

      const allUploads: { file: File; docType: string }[] = [
        ...REQUIRED_DOCS.map((d) => ({
          file: requiredFiles[d.id]!.file,
          docType: d.id,
        })),
        ...optionalFiles,
      ];

      const failedUploads: string[] = [];
      for (const entry of allUploads) {
        const safeName = entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${requestId}/${entry.docType}-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('cso-documents')
          .upload(path, entry.file, {
            contentType: entry.file.type || 'application/octet-stream',
            upsert: false,
          });
        if (uploadError) {
          console.error('upload error', uploadError);
          failedUploads.push(entry.file.name);
          continue;
        }
        const { error: docError } = await supabase.from('cso_documents').insert({
          request_id: requestId,
          doc_type: entry.docType,
          file_path: path,
          file_name: entry.file.name,
          mime_type: entry.file.type || null,
          size_bytes: entry.file.size,
        });
        if (docError) {
          console.error('doc record error', docError);
          failedUploads.push(entry.file.name);
        }
      }

      if (failedUploads.length > 0) {
        toast.warning(
          `Request submitted, but ${failedUploads.length} document(s) failed to upload. A reviewer will contact you.`,
        );
      } else {
        toast.success(
          'Verification request submitted. We will review and email you within 5 business days.',
        );
      }

      setRequiredFiles({});
      setOptionalFiles([]);
      setForm({
        organizationName: '',
        legalName: '',
        registrationNumber: '',
        country: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        description: '',
        missionStatement: '',
        yearsActive: '',
        staffCount: '',
        ifcnSignatory: false,
        methodologyUrl: '',
        correctionsPolicyUrl: '',
        fundingDisclosureUrl: '',
        ownershipDisclosureUrl: '',
        consent: false,
      });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section: Organization */}
      <SectionHeader
        title="Organization details"
        subtitle="Tell us who you are. All fields here help reviewers identify your registered entity."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Organization name *" hint="Public-facing name (e.g. 'FactCheck.org').">
          <Input
            value={form.organizationName}
            onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
            maxLength={200}
            required
          />
        </Field>
        <Field label="Legal entity name *" hint="As it appears on your registration certificate.">
          <Input
            value={form.legalName}
            onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            maxLength={200}
            required
          />
        </Field>
        <Field label="Registration number *" hint="ID issued by the registry (NGO/charity/company).">
          <Input
            value={form.registrationNumber}
            onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            maxLength={120}
            required
          />
        </Field>
        <Field label="Country of registration *">
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {ALL_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Website *" hint="Your public organization site.">
          <Input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
            maxLength={500}
            required
          />
        </Field>
        <Field label="Years active">
          <Input
            type="number"
            min={0}
            value={form.yearsActive}
            onChange={(e) => setForm({ ...form, yearsActive: e.target.value })}
          />
        </Field>
        <Field label="Staff count">
          <Input
            type="number"
            min={0}
            value={form.staffCount}
            onChange={(e) => setForm({ ...form, staffCount: e.target.value })}
          />
        </Field>
      </div>

      <Field label="What does your organization do? * (min 20 chars)">
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={5000}
          required
        />
      </Field>
      <Field label="Mission statement">
        <Textarea
          rows={2}
          value={form.missionStatement}
          onChange={(e) => setForm({ ...form, missionStatement: e.target.value })}
          maxLength={2000}
        />
      </Field>

      {/* Section: Contact */}
      <SectionHeader
        title="Authorized contact person"
        subtitle="The person submitting this application. We will verify their identity."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name *">
          <Input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            maxLength={200}
            required
          />
        </Field>
        <Field label="Email *" hint="Use an email at your organization's domain if possible.">
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            maxLength={320}
            required
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            maxLength={60}
          />
        </Field>
      </div>

      {/* Section: Editorial standards (URL or file) */}
      <SectionHeader
        title="Editorial standards"
        subtitle="In line with IFCN and EFCSN, we need proof of your fact-checking methodology, corrections policy, and funding disclosure. Provide a public URL or attach a document below."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Methodology URL *" hint="Public page describing how you fact-check.">
          <Input
            type="url"
            value={form.methodologyUrl}
            onChange={(e) => setForm({ ...form, methodologyUrl: e.target.value })}
            placeholder="https://your-org/methodology"
            maxLength={500}
          />
        </Field>
        <Field label="Corrections policy URL *" hint="Public page describing how you correct errors.">
          <Input
            type="url"
            value={form.correctionsPolicyUrl}
            onChange={(e) => setForm({ ...form, correctionsPolicyUrl: e.target.value })}
            placeholder="https://your-org/corrections"
            maxLength={500}
          />
        </Field>
        <Field label="Funding disclosure URL *" hint="Public page listing funders / revenue sources.">
          <Input
            type="url"
            value={form.fundingDisclosureUrl}
            onChange={(e) => setForm({ ...form, fundingDisclosureUrl: e.target.value })}
            placeholder="https://your-org/funding"
            maxLength={500}
          />
        </Field>
        <Field label="Ownership / governance URL" hint="Optional — page describing ownership or board.">
          <Input
            type="url"
            value={form.ownershipDisclosureUrl}
            onChange={(e) => setForm({ ...form, ownershipDisclosureUrl: e.target.value })}
            placeholder="https://your-org/about"
            maxLength={500}
          />
        </Field>
      </div>
      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <span>
          If any of the three required policies is not on a public URL yet, attach it as a document
          in the optional uploads section below.
        </span>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="ifcn"
          checked={form.ifcnSignatory}
          onCheckedChange={(v) => setForm({ ...form, ifcnSignatory: Boolean(v) })}
        />
        <Label htmlFor="ifcn" className="text-sm font-normal leading-snug">
          We are an IFCN signatory or follow equivalent fact-checking standards.
        </Label>
      </div>

      {/* Section: Required documents */}
      <SectionHeader
        title="Required documents"
        subtitle="Reviewers cannot approve your organization without these. Files are private — only Rumor Radar staff can read them."
      />
      <div className="space-y-2">
        {REQUIRED_DOCS.map((doc) => (
          <RequiredSlot
            key={doc.id}
            label={doc.label}
            hint={doc.hint}
            file={requiredFiles[doc.id]?.file ?? null}
            onFile={(f) => setRequiredFile(doc.id, f)}
          />
        ))}
      </div>

      {/* Section: Optional documents */}
      <SectionHeader
        title="Additional documents (optional)"
        subtitle="Attach methodology, corrections policy, funding disclosure or other supporting files if they are not on a public URL."
      />
      <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
        <OptionalUploader onAdd={addOptional} />
        {optionalFiles.length > 0 && (
          <ul className="space-y-1.5 mt-2">
            {optionalFiles.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded border border-border bg-background/50 p-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="truncate">
                    <span className="font-medium">{entry.file.name}</span>
                    <span className="text-muted-foreground ml-1">
                      ({OPTIONAL_DOCS.find((d) => d.id === entry.docType)?.label})
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeOptional(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="consent"
          checked={form.consent}
          onCheckedChange={(v) => setForm({ ...form, consent: Boolean(v) })}
          required
        />
        <Label htmlFor="consent" className="text-sm font-normal leading-snug">
          I confirm I am authorized to apply on behalf of this organization, that the documents I
          have uploaded are authentic, and that the information provided is accurate. *
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <ShieldCheck className="h-4 w-4" />
          Submit application
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-border pb-1.5 space-y-0.5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground/80 leading-snug">{hint}</div>}
    </div>
  );
}

function RequiredSlot({
  label,
  hint,
  file,
  onFile,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const filled = !!file;
  return (
    <div
      className={`rounded-md border p-3 space-y-2 transition-colors ${
        filled ? 'border-success/40 bg-success/5' : 'border-border bg-secondary/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {filled ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {label}
          </div>
          <div className="text-[11px] text-muted-foreground leading-snug pl-6">{hint}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-6">
        {filled ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-xs">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file!.name}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={() => onFile(null)}
            >
              <X className="h-3 w-3" /> Replace
            </Button>
          </>
        ) : (
          <Input
            type="file"
            className="h-9 max-w-xs"
            accept={ACCEPTED_TYPES}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        )}
      </div>
    </div>
  );
}

function OptionalUploader({ onAdd }: { onAdd: (file: File, docType: string) => void }) {
  const [docType, setDocType] = useState<string>(OPTIONAL_DOCS[0].id);
  const [pending, setPending] = useState<File | null>(null);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1 min-w-[14rem]">
        <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Document type
        </Label>
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPTIONAL_DOCS.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="file"
        className="h-9 max-w-xs"
        accept={ACCEPTED_TYPES}
        onChange={(e) => setPending(e.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!pending}
        onClick={(e) => {
          if (pending) {
            onAdd(pending, docType);
            setPending(null);
            const input = (e.currentTarget.parentElement?.querySelector(
              'input[type="file"]',
            ) as HTMLInputElement | null);
            if (input) input.value = '';
          }
        }}
      >
        <Upload className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}
