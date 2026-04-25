-- Admin-only: find a user id by email (searches auth.users via security definer)
create or replace function public.admin_find_user_by_email(_email text)
returns table(user_id uuid, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can look up users';
  end if;

  return query
  select u.id, u.email::text
    from auth.users u
   where lower(u.email) = lower(_email)
   limit 1;
end;
$$;

-- Admin-only: grant a role to a user identified by email
create or replace function public.admin_grant_role(_email text, _role public.app_role)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid;
  _row_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can grant roles';
  end if;

  select id into _user_id from auth.users where lower(email) = lower(_email) limit 1;
  if _user_id is null then
    raise exception 'No user found for email %', _email;
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (_user_id, _role, auth.uid())
  on conflict (user_id, role) do update
    set granted_by = excluded.granted_by,
        granted_at = now()
  returning id into _row_id;

  return _row_id;
end;
$$;

-- Admin-only: revoke a role from a user identified by email
create or replace function public.admin_revoke_role(_email text, _role public.app_role)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can revoke roles';
  end if;

  select id into _user_id from auth.users where lower(email) = lower(_email) limit 1;
  if _user_id is null then
    raise exception 'No user found for email %', _email;
  end if;

  delete from public.user_roles
   where user_id = _user_id and role = _role;

  return found;
end;
$$;

-- Admin-only: list all role assignments with user email
create or replace function public.admin_list_roles()
returns table(
  user_id uuid,
  email text,
  role public.app_role,
  granted_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can list roles';
  end if;

  return query
  select ur.user_id, u.email::text, ur.role, ur.granted_at
    from public.user_roles ur
    join auth.users u on u.id = ur.user_id
   order by ur.granted_at desc;
end;
$$;

-- Make sure unique constraint exists for upsert above (user_id, role)
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'user_roles_user_id_role_key'
       and conrelid = 'public.user_roles'::regclass
  ) then
    alter table public.user_roles
      add constraint user_roles_user_id_role_key unique (user_id, role);
  end if;
end$$;