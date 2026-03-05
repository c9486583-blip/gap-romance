CREATE TABLE public.virtual_gifts_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  gift_id text NOT NULL,
  gift_name text NOT NULL,
  gift_emoji text NOT NULL,
  gift_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_gifts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see gifts they sent or received"
  ON public.virtual_gifts_sent FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert gifts they send"
  ON public.virtual_gifts_sent FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);