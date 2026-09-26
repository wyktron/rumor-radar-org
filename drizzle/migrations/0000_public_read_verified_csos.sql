-- Allow the public to read verified CSOs through the public view
GRANT SELECT ON public.csos_public TO anon, authenticated;

CREATE POLICY "Public can read verified CSOs"
  ON public.csos FOR SELECT
  TO anon, authenticated
  USING (verified = true);

GRANT SELECT (id, name, country, country_code, latitude, longitude, verified, description, website, date_joined, created_at, updated_at)
  ON public.csos TO anon, authenticated;