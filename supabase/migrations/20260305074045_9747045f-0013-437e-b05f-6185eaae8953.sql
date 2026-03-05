-- Create moderation_logs table for all moderation events
CREATE TABLE public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  content text,
  classification text NOT NULL DEFAULT 'SAFE',
  reason text,
  content_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read moderation logs
CREATE POLICY "Admins can read moderation logs"
ON public.moderation_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (edge function uses service role), but allow insert for authenticated too
CREATE POLICY "Service can insert moderation logs"
ON public.moderation_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add is_blocked column to messages for BLOCKED classification
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Add is_suspended to profiles for auto-suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;