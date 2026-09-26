ALTER TABLE public.loved_one_submissions
  ADD COLUMN IF NOT EXISTS requester_full_name text,
  ADD COLUMN IF NOT EXISTS requester_email text,
  ADD COLUMN IF NOT EXISTS requester_phone text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS id_verification_method text,
  ADD COLUMN IF NOT EXISTS id_document_type text,
  ADD COLUMN IF NOT EXISTS id_document_country text,
  ADD COLUMN IF NOT EXISTS id_document_last4 text,
  ADD COLUMN IF NOT EXISTS id_verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS id_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_permission boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_privacy boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.loved_one_submissions.id_verification_method IS 'eIDAS-aligned identity check used by the requester (eu_wallet, national_eid, document_selfie).';