
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_session_id text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'not_started';
