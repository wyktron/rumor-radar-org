-- Fix search_path on the touch_updated_at function
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tighten public-insert policies with size caps (still open — anonymous forms — but bounded)

drop policy if exists "Anyone can submit a rumor" on public.rumor_submissions;
create policy "Anyone can submit a rumor" on public.rumor_submissions
  for insert with check (
    length(claim) between 8 and 280
    and length(coalesce(description, '')) <= 1000
    and length(origin_country) between 1 and 120
    and length(coalesce(subject_country, '')) <= 120
    and length(topic) between 1 and 60
  );

drop policy if exists "Anyone can submit a CSO verification request" on public.cso_verification_requests;
create policy "Anyone can submit a CSO verification request" on public.cso_verification_requests
  for insert with check (
    length(organization_name) between 2 and 200
    and length(contact_name) between 2 and 200
    and length(contact_email) between 5 and 320
    and length(description) between 20 and 5000
    and length(country) between 2 and 120
  );

drop policy if exists "Anyone can attach docs during submission" on public.cso_documents;
create policy "Anyone can attach docs during submission" on public.cso_documents
  for insert with check (
    length(doc_type) between 1 and 80
    and length(file_path) between 1 and 500
    and length(file_name) between 1 and 300
    and (size_bytes is null or size_bytes <= 25 * 1024 * 1024)  -- 25 MB max
  );

drop policy if exists "Anyone can create an invite" on public.rumor_invites;
create policy "Anyone can create an invite" on public.rumor_invites
  for insert with check (
    length(invitee_name) between 2 and 200
    and length(invitee_email) between 5 and 320
    and length(coalesce(message, '')) <= 2000
  );

drop policy if exists "Anyone can submit loved-one outreach" on public.loved_one_submissions;
create policy "Anyone can submit loved-one outreach" on public.loved_one_submissions
  for insert with check (
    length(contact_value) between 3 and 200
    and length(country) between 2 and 120
    and length(relationship) between 2 and 80
    and length(notes) between 5 and 1000
  );

drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe" on public.subscribers
  for insert with check (
    length(email) between 5 and 320
    and consented_terms = true
    and consented_privacy = true
  );