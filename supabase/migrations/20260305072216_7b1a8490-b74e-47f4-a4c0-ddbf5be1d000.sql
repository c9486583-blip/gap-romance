
CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (pre-signup, no auth yet)
CREATE POLICY "Anyone can create phone verification" ON public.phone_verifications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anyone to read their own verification by phone
CREATE POLICY "Anyone can read phone verification" ON public.phone_verifications
  FOR SELECT TO anon, authenticated USING (true);

-- Allow updates for verification
CREATE POLICY "Anyone can update phone verification" ON public.phone_verifications
  FOR UPDATE TO anon, authenticated USING (true);
