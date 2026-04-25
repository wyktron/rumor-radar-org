-- Make sure UPDATEs send the full row payload over realtime so the
-- moderator dashboard can react to status changes without a refetch.
ALTER TABLE public.csos REPLICA IDENTITY FULL;
ALTER TABLE public.rumor_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.debunk_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.cso_verification_requests REPLICA IDENTITY FULL;
ALTER TABLE public.loved_one_submissions REPLICA IDENTITY FULL;

-- Add tables to the realtime publication (idempotent guards).
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.csos;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rumor_submissions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.debunk_submissions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cso_verification_requests;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loved_one_submissions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;