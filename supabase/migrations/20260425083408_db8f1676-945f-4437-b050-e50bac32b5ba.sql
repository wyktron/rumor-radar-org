-- =============================================================
-- Enums
-- =============================================================
create type public.app_role as enum ('admin', 'moderator', 'cso_member', 'user');

create type public.region_status as enum (
  'sovereign',
  'partially_recognized',
  'disputed_territory',
  'non_self_governing',
  'autonomous_region',
  'special_administrative_region'
);

create type public.rumor_status as enum ('pending', 'approved', 'debunked', 'verified-true', 'rejected');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.cso_request_status as enum ('pending', 'under_review', 'approved', 'rejected', 'changes_requested');
create type public.invite_kind as enum ('cso_debunk', 'person_respond', 'institution_respond', 'organization_respond');
create type public.invite_status as enum ('pending', 'sent', 'accepted', 'declined', 'expired');
create type public.subscriber_status as enum ('pending', 'confirmed', 'unsubscribed', 'bounced');
create type public.contact_method as enum ('phone', 'sms', 'email');
create type public.loved_one_status as enum ('pending', 'contacted', 'completed', 'unable_to_reach');
create type public.donation_status as enum ('pending', 'completed', 'failed', 'refunded');
create type public.donation_provider as enum ('stripe', 'paypal', 'btc', 'manual');
create type public.api_key_tier as enum ('free', 'starter', 'pro', 'enterprise');
create type public.scraper_source as enum ('reddit', 'telegram', 'twitter', 'web', 'rss', 'other');
create type public.scraped_rumor_status as enum ('new', 'reviewing', 'approved', 'rejected', 'duplicate');

-- =============================================================
-- updated_at helper
-- =============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- Profiles
-- =============================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  preferred_language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by self" on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, display_name, preferred_language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- User roles (separate table — never on profiles)
-- =============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin', 'moderator')
  )
$$;

create policy "Users see own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins see all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- =============================================================
-- Regions (countries + disputed / unrecognized territories)
-- =============================================================
create table public.regions (
  code text primary key,
  name text not null,
  short_name text,
  status public.region_status not null default 'sovereign',
  notes text,
  iso_alpha2 text,
  parent_code text references public.regions(code),
  latitude numeric(7,4),
  longitude numeric(8,4),
  phone_prefix text,
  display_order int default 1000,
  created_at timestamptz not null default now()
);
alter table public.regions enable row level security;

create policy "Regions readable by all" on public.regions
  for select using (true);
create policy "Admins manage regions" on public.regions
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index regions_status_idx on public.regions(status);

-- =============================================================
-- CSOs
-- =============================================================
create table public.csos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text references public.regions(code),
  country text not null,
  description text not null,
  website text,
  contact_email text not null,
  latitude numeric(7,4),
  longitude numeric(8,4),
  verified boolean not null default false,
  date_joined timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.csos enable row level security;

create policy "CSOs readable by all" on public.csos for select using (true);
create policy "Staff manage CSOs" on public.csos
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger csos_touch before update on public.csos
  for each row execute function public.touch_updated_at();

-- =============================================================
-- CSO membership (links auth user to a CSO)
-- =============================================================
create table public.cso_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cso_id uuid not null references public.csos(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, cso_id)
);
alter table public.cso_members enable row level security;

create policy "Members see own membership" on public.cso_members
  for select to authenticated using (auth.uid() = user_id);
create policy "Staff see all memberships" on public.cso_members
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage memberships" on public.cso_members
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- =============================================================
-- CSO verification requests (NGO-style: docs, admin review, then provision)
-- =============================================================
create table public.cso_verification_requests (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  legal_name text,
  registration_number text,
  country_code text references public.regions(code),
  country text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  website text,
  description text not null,
  mission_statement text,
  years_active int,
  staff_count int,
  ifcn_signatory boolean default false,
  -- Approval state
  status public.cso_request_status not null default 'pending',
  reviewer_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  -- Provisioning result
  provisioned_cso_id uuid references public.csos(id),
  provisioned_user_id uuid references auth.users(id),
  -- Audit
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cso_verification_requests enable row level security;

create policy "Anyone can submit a CSO verification request" on public.cso_verification_requests
  for insert with check (true);
create policy "Staff see all CSO verification requests" on public.cso_verification_requests
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage CSO verification requests" on public.cso_verification_requests
  for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger cso_req_touch before update on public.cso_verification_requests
  for each row execute function public.touch_updated_at();

-- Documents uploaded with the verification request
create table public.cso_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.cso_verification_requests(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_name text not null,
  size_bytes bigint,
  mime_type text,
  uploaded_at timestamptz not null default now()
);
alter table public.cso_documents enable row level security;

create policy "Anyone can attach docs during submission" on public.cso_documents
  for insert with check (true);
create policy "Staff read CSO docs" on public.cso_documents
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage CSO docs" on public.cso_documents
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Storage bucket for CSO verification documents (private)
insert into storage.buckets (id, name, public)
values ('cso-documents', 'cso-documents', false)
on conflict (id) do nothing;

create policy "Staff read cso-documents bucket" on storage.objects
  for select to authenticated
  using (bucket_id = 'cso-documents' and public.is_staff(auth.uid()));
create policy "Anyone can upload to cso-documents bucket" on storage.objects
  for insert with check (bucket_id = 'cso-documents');

-- =============================================================
-- Rumors
-- =============================================================
create table public.rumors (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  origin_country text not null,
  origin_country_code text references public.regions(code),
  subject_country text,
  subject_country_code text references public.regions(code),
  topic text not null,
  latitude numeric(7,4) not null,
  longitude numeric(8,4) not null,
  intensity numeric(3,2) not null default 0.5 check (intensity >= 0 and intensity <= 1),
  status public.rumor_status not null default 'pending',
  source_language text not null default 'en',
  source_url text,
  -- debunk
  debunked_by text,
  debunked_at timestamptz,
  debunk_content text,
  debunk_sources text[],
  debunked_by_cso_id uuid references public.csos(id),
  -- verification
  verified_by text,
  verified_at timestamptz,
  verification_content text,
  verification_sources text[],
  verified_by_cso_id uuid references public.csos(id),
  -- provenance
  submitted_by uuid references auth.users(id),
  scraped_from_id uuid,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rumors enable row level security;

create policy "Rumors readable by all" on public.rumors
  for select using (status in ('approved', 'debunked', 'verified-true'));
create policy "Staff read all rumors" on public.rumors
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage rumors" on public.rumors
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger rumors_touch before update on public.rumors
  for each row execute function public.touch_updated_at();

create index rumors_status_idx on public.rumors(status);
create index rumors_topic_idx on public.rumors(topic);
create index rumors_origin_country_idx on public.rumors(origin_country);

-- AI translations
create table public.rumor_translations (
  id uuid primary key default gen_random_uuid(),
  rumor_id uuid not null references public.rumors(id) on delete cascade,
  language text not null,
  title text not null,
  description text not null,
  debunk_content text,
  verification_content text,
  is_machine_translated boolean not null default true,
  translated_at timestamptz not null default now(),
  unique (rumor_id, language)
);
alter table public.rumor_translations enable row level security;

create policy "Translations readable by all" on public.rumor_translations
  for select using (true);
create policy "Staff manage translations" on public.rumor_translations
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- =============================================================
-- Rumor submissions (user-submitted, awaiting moderation)
-- =============================================================
create table public.rumor_submissions (
  id uuid primary key default gen_random_uuid(),
  claim text not null,
  description text,
  origin_country text not null,
  origin_country_code text references public.regions(code),
  origin_latitude numeric(7,4),
  origin_longitude numeric(8,4),
  subject_country text,
  topic text not null,
  source text,
  source_url text,
  source_language text default 'en',
  submitted_by uuid references auth.users(id),
  submitter_email text,
  status public.submission_status not null default 'pending',
  reviewer_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  resulting_rumor_id uuid references public.rumors(id),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rumor_submissions enable row level security;

create policy "Anyone can submit a rumor" on public.rumor_submissions
  for insert with check (true);
create policy "Submitters see own submissions" on public.rumor_submissions
  for select to authenticated using (auth.uid() = submitted_by);
create policy "Staff see all submissions" on public.rumor_submissions
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage submissions" on public.rumor_submissions
  for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger rumor_subs_touch before update on public.rumor_submissions
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Debunk submissions
-- =============================================================
create table public.debunk_submissions (
  id uuid primary key default gen_random_uuid(),
  rumor_id uuid not null references public.rumors(id) on delete cascade,
  cso_id uuid not null references public.csos(id) on delete cascade,
  cso_name text not null,
  submitted_by uuid references auth.users(id),
  content text not null,
  sources text[] not null default '{}',
  submission_type text not null check (submission_type in ('debunk', 'verify-true')),
  status public.submission_status not null default 'pending',
  reviewer_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.debunk_submissions enable row level security;

create policy "CSO members create debunks" on public.debunk_submissions
  for insert to authenticated with check (
    exists (select 1 from public.cso_members m where m.user_id = auth.uid() and m.cso_id = debunk_submissions.cso_id)
  );
create policy "CSO members see own debunks" on public.debunk_submissions
  for select to authenticated using (
    exists (select 1 from public.cso_members m where m.user_id = auth.uid() and m.cso_id = debunk_submissions.cso_id)
  );
create policy "Staff manage debunks" on public.debunk_submissions
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger debunks_touch before update on public.debunk_submissions
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Rumor invites (Invite a CSO to debunk / Invite to respond)
-- =============================================================
create table public.rumor_invites (
  id uuid primary key default gen_random_uuid(),
  rumor_id uuid references public.rumors(id) on delete cascade,
  rumor_submission_id uuid references public.rumor_submissions(id) on delete cascade,
  kind public.invite_kind not null,
  invitee_name text not null,
  invitee_email text not null,
  invitee_role text,
  party_type text,
  message text,
  status public.invite_status not null default 'pending',
  email_sent_at timestamptz,
  responded_at timestamptz,
  created_by uuid references auth.users(id),
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rumor_invites enable row level security;

create policy "Anyone can create an invite" on public.rumor_invites
  for insert with check (true);
create policy "Staff see all invites" on public.rumor_invites
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage invites" on public.rumor_invites
  for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger invites_touch before update on public.rumor_invites
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Loved-one outreach submissions
-- =============================================================
create table public.loved_one_submissions (
  id uuid primary key default gen_random_uuid(),
  contact_method public.contact_method not null,
  contact_value text not null,
  best_time_to_call text,
  country text not null,
  country_code text references public.regions(code),
  relationship text not null,
  notes text not null,
  submitter_email text,
  status public.loved_one_status not null default 'pending',
  staff_notes text,
  contacted_at timestamptz,
  ip_address text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.loved_one_submissions enable row level security;

create policy "Anyone can submit loved-one outreach" on public.loved_one_submissions
  for insert with check (true);
create policy "Staff see all loved-one submissions" on public.loved_one_submissions
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage loved-one submissions" on public.loved_one_submissions
  for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger lo_touch before update on public.loved_one_submissions
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Subscribers (newsletter — double opt-in)
-- =============================================================
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status public.subscriber_status not null default 'pending',
  notify_debunks boolean not null default true,
  notify_confirmations boolean not null default true,
  countries text[] not null default '{}',
  preferred_language text default 'en',
  confirm_token text not null default replace(gen_random_uuid()::text, '-', ''),
  confirmed_at timestamptz,
  unsubscribe_token text not null default replace(gen_random_uuid()::text, '-', ''),
  unsubscribed_at timestamptz,
  consented_terms boolean not null default false,
  consented_privacy boolean not null default false,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;

create policy "Anyone can subscribe" on public.subscribers
  for insert with check (true);
create policy "Staff see all subscribers" on public.subscribers
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage subscribers" on public.subscribers
  for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger subs_touch before update on public.subscribers
  for each row execute function public.touch_updated_at();

create index subscribers_status_idx on public.subscribers(status);

-- =============================================================
-- Donations
-- =============================================================
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  provider public.donation_provider not null,
  provider_payment_id text,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'USD',
  donor_email text,
  donor_name text,
  message text,
  is_anonymous boolean not null default false,
  status public.donation_status not null default 'pending',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.donations enable row level security;

create policy "Staff see all donations" on public.donations
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage donations" on public.donations
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger donations_touch before update on public.donations
  for each row execute function public.touch_updated_at();

-- =============================================================
-- API keys for paid Impact data API
-- =============================================================
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contact_email text not null,
  organization text,
  key_hash text not null unique,
  key_prefix text not null,
  tier public.api_key_tier not null default 'free',
  monthly_request_limit int not null default 1000,
  is_active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.api_keys enable row level security;

create policy "Users see own api keys" on public.api_keys
  for select to authenticated using (auth.uid() = user_id);
create policy "Users create own api keys" on public.api_keys
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Staff see all api keys" on public.api_keys
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage api keys" on public.api_keys
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger api_keys_touch before update on public.api_keys
  for each row execute function public.touch_updated_at();

create table public.api_usage (
  id bigserial primary key,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  endpoint text not null,
  status_code int,
  response_ms int,
  ip_address text,
  created_at timestamptz not null default now()
);
alter table public.api_usage enable row level security;

create policy "Users see own usage" on public.api_usage
  for select to authenticated using (
    exists (select 1 from public.api_keys k where k.id = api_usage.api_key_id and k.user_id = auth.uid())
  );
create policy "Staff see all usage" on public.api_usage
  for select to authenticated using (public.is_staff(auth.uid()));

create index api_usage_key_idx on public.api_usage(api_key_id, created_at desc);

-- =============================================================
-- AI scraper
-- =============================================================
create table public.scraper_runs (
  id uuid primary key default gen_random_uuid(),
  source public.scraper_source not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_found int not null default 0,
  items_kept int not null default 0,
  error text,
  created_at timestamptz not null default now()
);
alter table public.scraper_runs enable row level security;

create policy "Staff see scraper runs" on public.scraper_runs
  for select to authenticated using (public.is_staff(auth.uid()));

create table public.scraped_rumors (
  id uuid primary key default gen_random_uuid(),
  source public.scraper_source not null,
  source_url text not null,
  source_language text,
  raw_text text not null,
  title text not null,
  description text,
  topic text,
  detected_country text,
  detected_country_code text references public.regions(code),
  latitude numeric(7,4),
  longitude numeric(8,4),
  ai_summary text,
  ai_confidence numeric(3,2),
  status public.scraped_rumor_status not null default 'new',
  duplicate_of uuid references public.rumors(id),
  promoted_to_rumor_id uuid references public.rumors(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.scraped_rumors enable row level security;

create policy "Staff see scraped rumors" on public.scraped_rumors
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage scraped rumors" on public.scraped_rumors
  for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger scraped_touch before update on public.scraped_rumors
  for each row execute function public.touch_updated_at();

create index scraped_status_idx on public.scraped_rumors(status);