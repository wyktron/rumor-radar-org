CREATE POLICY "CSO members read pending rumors"
ON public.rumors
FOR SELECT
TO authenticated
USING (status = 'pending'::rumor_status AND public.has_role(auth.uid(), 'cso_member'));