-- Status enum for contact messages
CREATE TYPE public.contact_message_status AS ENUM ('new', 'read', 'archived', 'spam');

-- Contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status public.contact_message_status NOT NULL DEFAULT 'new',
  ip_address TEXT,
  user_agent TEXT,
  staff_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (with length validation)
CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (
  length(name) BETWEEN 2 AND 120
  AND length(email) BETWEEN 5 AND 320
  AND length(subject) BETWEEN 3 AND 200
  AND length(message) BETWEEN 10 AND 5000
  AND length(COALESCE(organization, '')) <= 200
);

-- Staff can read all
CREATE POLICY "Staff see all contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- Staff can update (status, notes)
CREATE POLICY "Staff manage contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- updated_at trigger (reuses existing touch_updated_at function)
CREATE TRIGGER contact_messages_touch_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);