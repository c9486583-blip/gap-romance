
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS flag_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_purchased_cents_month integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_month_key text;
