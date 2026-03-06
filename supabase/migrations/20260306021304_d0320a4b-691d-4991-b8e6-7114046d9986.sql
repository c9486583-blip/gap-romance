
-- Table to track daily messaging time usage per user
CREATE TABLE public.messaging_time (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  seconds_used integer NOT NULL DEFAULT 0,
  bonus_seconds integer NOT NULL DEFAULT 0,
  has_unlimited boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.messaging_time ENABLE ROW LEVEL SECURITY;

-- Users can read their own messaging time
CREATE POLICY "Users can read own messaging time"
  ON public.messaging_time FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messaging time
CREATE POLICY "Users can insert own messaging time"
  ON public.messaging_time FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own messaging time
CREATE POLICY "Users can update own messaging time"
  ON public.messaging_time FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all messaging time"
  ON public.messaging_time FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
