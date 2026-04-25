-- Approve a CSO verification request: create the public csos row,
-- link it back to the request, and return the new cso id.
create or replace function public.approve_cso_request(
  _request_id uuid,
  _notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _req public.cso_verification_requests%rowtype;
  _country_lat numeric;
  _country_lng numeric;
  _new_cso_id uuid;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can approve CSO requests';
  end if;

  select * into _req
  from public.cso_verification_requests
  where id = _request_id
  for update;

  if not found then
    raise exception 'CSO verification request % not found', _request_id;
  end if;

  if _req.status = 'approved' and _req.provisioned_cso_id is not null then
    return _req.provisioned_cso_id;
  end if;

  -- Best-effort lookup of country coordinates from regions.
  select latitude, longitude
    into _country_lat, _country_lng
    from public.regions
   where code = _req.country_code
   limit 1;

  insert into public.csos (
    name, country, country_code, latitude, longitude,
    contact_email, description, website, verified
  ) values (
    _req.organization_name,
    _req.country,
    _req.country_code,
    _country_lat,
    _country_lng,
    _req.contact_email,
    _req.description,
    _req.website,
    true
  )
  returning id into _new_cso_id;

  update public.cso_verification_requests
     set status = 'approved',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         reviewer_notes = coalesce(_notes, reviewer_notes),
         provisioned_cso_id = _new_cso_id
   where id = _request_id;

  return _new_cso_id;
end;
$$;

revoke all on function public.approve_cso_request(uuid, text) from public;
grant execute on function public.approve_cso_request(uuid, text) to authenticated;

-- Reject a CSO verification request with optional notes.
create or replace function public.reject_cso_request(
  _request_id uuid,
  _notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can reject CSO requests';
  end if;

  update public.cso_verification_requests
     set status = 'rejected',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         reviewer_notes = coalesce(_notes, reviewer_notes)
   where id = _request_id;

  return found;
end;
$$;

revoke all on function public.reject_cso_request(uuid, text) from public;
grant execute on function public.reject_cso_request(uuid, text) to authenticated;

-- Generate a short-lived signed URL for a CSO document. Reviewer-only.
create or replace function public.cso_document_signed_url(
  _document_id uuid,
  _expires_seconds int default 600
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _path text;
  _signed jsonb;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can read CSO documents';
  end if;

  select file_path into _path
    from public.cso_documents
   where id = _document_id;

  if _path is null then
    raise exception 'Document % not found', _document_id;
  end if;

  -- storage.create_signed_url returns jsonb {signedURL, ...}
  select storage.create_signed_url('cso-documents', _path, _expires_seconds)
    into _signed;

  return _signed ->> 'signedURL';
exception when undefined_function then
  -- Older storage versions: fall back to null and let the client request via REST.
  return null;
end;
$$;

revoke all on function public.cso_document_signed_url(uuid, int) from public;
grant execute on function public.cso_document_signed_url(uuid, int) to authenticated;