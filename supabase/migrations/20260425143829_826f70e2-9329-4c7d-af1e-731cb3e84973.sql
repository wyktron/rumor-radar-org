-- Add public URL fields that IFCN/EFCSN accept in lieu of uploaded files
-- (editorial methodology, corrections policy, ownership/funding disclosure
-- pages should normally be public on the org's website).
ALTER TABLE public.cso_verification_requests
  ADD COLUMN IF NOT EXISTS methodology_url TEXT,
  ADD COLUMN IF NOT EXISTS corrections_policy_url TEXT,
  ADD COLUMN IF NOT EXISTS funding_disclosure_url TEXT,
  ADD COLUMN IF NOT EXISTS ownership_disclosure_url TEXT;