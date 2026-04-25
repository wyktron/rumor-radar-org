import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COUNTRIES } from '@/constants/countries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  organizationName: z.string().trim().min(2).max(200),
  legalName: z.string().trim().max(200).optional().or(z.literal('')),
  registrationNumber: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(200),
  contactEmail: z.string().trim().email().max(320),
  contactPhone: z.string().trim().max(60).optional().or(z.literal('')),
  website: z.string().trim().url().max(500).optional().or(z.literal('')),
  description: z.string().trim().min(20).max(5000),
  missionStatement: z.string().trim().max(2000).optional().or(z.literal('')),
  yearsActive: z.coerce.number().int().min(0).max(500).optional().or(z.literal('' as never)),
  staffCount: z.coerce.number().int().min(0).max(100000).optional().or(z.literal('' as never)),
  ifcnSignatory: z.boolean().default(false),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the verification terms.' }),
  }),
});

const DOC_TYPES = [
  { id: 'registration', label: 'Registration / incorporation certificate' },
  { id: 'mission', label: 'Mission statement / charter' },
  { id: 'staff_list', label: 'Staff or board list' },
  { id: 'methodology', label: 'Fact-check methodology' },
  { id: 'funding', label: 'Funding & transparency disclosure' },
  { id: 'other', label: 'Other supporting document' },
];

interface UploadedDoc {
  file: File;
  docType: string;
}

interface Props {
  /** Called after a successful submission (e.g. to close a containing dialog). */
  onSuccess?: () => void;
  /** Called when the user clicks Cancel. If omitted, the Cancel button is hidden. */
  onCancel?: () => void;
}

export function CSORegistrationForm({ onSuccess, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadedDoc[]>([]);
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
    consent: false,
  });

  function addFile(file: File, docType: string) {
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File too large (max 25 MB)');
      return;
    }
    setFiles((prev) => [...prev, { file, docType }]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

      if (files.length === 0) {
        toast.error('Please attach at least one supporting document.');
        setSubmitting(false);
        return;
      }

      const data = parsed.data;
      const country = COUNTRIES.find((c) => c.name === data.country);

      const { data: insertData, error: insertError } = await supabase
        .from('cso_verification_requests')
        .insert({
          organization_name: data.organizationName,
          legal_name: data.legalName || null,
          registration_number: data.registrationNumber || null,
          country: data.country,
          country_code: country?.code ?? null,
          contact_name: data.contactName,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone || null,
          website: data.website || null,
          description: data.description,
          mission_statement: data.missionStatement || null,
          years_active: typeof data.yearsActive === 'number' ? data.yearsActive : null,
          staff_count: typeof data.staffCount === 'number' ? data.staffCount : null,
          ifcn_signatory: data.ifcnSignatory,
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

      const failedUploads: string[] = [];
      for (const entry of files) {
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
        toast.success('Verification request submitted. We will review and email you within 5 business days.');
      }

      setFiles([]);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Organization name *">
          <Input
            value={form.organizationName}
            onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
            maxLength={200}
            required
          />
        </Field>
        <Field label="Legal entity name">
          <Input
            value={form.legalName}
            onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            maxLength={200}
          />
        </Field>
        <Field label="Registration number">
          <Input
            value={form.registrationNumber}
            onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            maxLength={120}
          />
        </Field>
        <Field label="Country *">
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Contact name *">
          <Input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            maxLength={200}
            required
          />
        </Field>
        <Field label="Contact email *">
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            maxLength={320}
            required
          />
        </Field>
        <Field label="Contact phone">
          <Input
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            maxLength={60}
          />
        </Field>
        <Field label="Website">
          <Input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
            maxLength={500}
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

      <div className="space-y-2 rounded-md border border-border bg-secondary/30 p-3">
        <div className="text-sm font-semibold">Supporting documents *</div>
        <p className="text-xs text-muted-foreground">
          Upload at least one document so reviewers can verify your organization. Files are private; only Rumor
          Radar staff can read them.
        </p>
        <DocUploader onAdd={addFile} />
        {files.length > 0 && (
          <ul className="space-y-1.5 mt-2">
            {files.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded border border-border bg-background/50 p-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="truncate">
                    <span className="font-medium">{entry.file.name}</span>
                    <span className="text-muted-foreground ml-1">
                      ({DOC_TYPES.find((d) => d.id === entry.docType)?.label})
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeFile(i)}
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
          I confirm I am authorized to apply on behalf of this organization and that the information provided is
          accurate. *
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
          Submit application
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DocUploader({ onAdd }: { onAdd: (file: File, docType: string) => void }) {
  const [docType, setDocType] = useState('registration');
  const [pending, setPending] = useState<File | null>(null);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1 min-w-[12rem]">
        <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Document type</Label>
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((d) => (
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
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
        onChange={(e) => setPending(e.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!pending}
        onClick={() => {
          if (pending) {
            onAdd(pending, docType);
            setPending(null);
            const input = document.querySelector<HTMLInputElement>('input[type="file"]');
            if (input) input.value = '';
          }
        }}
      >
        <Upload className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}
