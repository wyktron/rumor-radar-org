-- Subscriptions table populated by Stripe webhooks
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null,
  price_id text,
  product_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'sandbox',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_env on public.subscriptions(user_id, environment);
create index if not exists idx_subscriptions_customer on public.subscriptions(stripe_customer_id);

alter table public.subscriptions enable row level security;

create policy "Users see own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Staff see all subscriptions"
  on public.subscriptions for select
  to authenticated
  using (public.is_staff(auth.uid()));

create policy "Service role manages subscriptions"
  on public.subscriptions for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- Helper to check active subscription server-side
create or replace function public.has_active_subscription(_user_id uuid, _environment text default 'sandbox')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = _user_id
      and environment = _environment
      and status in ('active', 'trialing', 'past_due')
      and (current_period_end is null or current_period_end > now())
  )
$$;