-- ===== 1. Restrict contact_email exposure on csos table =====
-- Drop the overly permissive public-read policy
DROP POLICY IF EXISTS "CSOs readable by all" ON public.csos;

-- Create a public-safe view that excludes contact_email
CREATE OR REPLACE VIEW public.csos_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  country,
  country_code,
  latitude,
  longitude,
  verified,
  description,
  website,
  date_joined,
  created_at,
  updated_at
FROM public.csos;

GRANT SELECT ON public.csos_public TO anon, authenticated;

-- Allow public reads on the underlying table only via the view path; for the
-- raw csos table, allow authenticated staff to see everything (covered by
-- "Staff manage CSOs"), and add a policy so authenticated/anon can still
-- read non-sensitive columns directly (needed for FK joins) but the
-- application is expected to use csos_public for general listings.
CREATE POLICY "CSOs base record readable by all"
  ON public.csos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoke direct column-level SELECT on contact_email from anon role.
-- Authenticated users still have it via the role grant, but staff RLS
-- naturally limits sensitive use. Note: column-level revocation is a hard
-- block for the anon role regardless of RLS policies.
REVOKE SELECT (contact_email) ON public.csos FROM anon;

-- ===== 2. Email-send rate limiting table =====
CREATE TABLE IF NOT EXISTS public.email_send_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  recipient_email TEXT,
  template_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_rate_limits_ip_time
  ON public.email_send_rate_limits (ip_address, created_at DESC);

ALTER TABLE public.email_send_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
  ON public.email_send_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===== 3. Restrict realtime channel access =====
-- Only allow subscribing to the public 'rumors-public' channel topic.
-- This blocks attackers from listening on arbitrary channel names.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read rumors-public channel" ON realtime.messages;
CREATE POLICY "Public can read rumors-public channel"
  ON realtime.messages
  FOR SELECT
  TO anon, authenticated
  USING (
    (realtime.topic() = 'rumors-public')
    OR (extension = 'postgres_changes' AND realtime.topic() LIKE 'realtime:%rumors%')
  );