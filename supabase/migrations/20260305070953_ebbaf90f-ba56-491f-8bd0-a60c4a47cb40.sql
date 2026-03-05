
-- Likes table
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL,
  liked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- Matches table (created when mutual like)
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_a_id, user_b_id)
);

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blocks table
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reason text NOT NULL,
  context text,
  message_id uuid REFERENCES public.messages(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Users can insert their own likes" ON public.likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = liker_id);
CREATE POLICY "Users can see their own likes" ON public.likes
  FOR SELECT TO authenticated USING (auth.uid() = liker_id OR auth.uid() = liked_id);

-- Matches policies
CREATE POLICY "Users can see their own matches" ON public.matches
  FOR SELECT TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Messages policies
CREATE POLICY "Users can see messages in their matches" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND (user_a_id = auth.uid() OR user_b_id = auth.uid()))
  );
CREATE POLICY "Users can send messages in their matches" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND (user_a_id = auth.uid() OR user_b_id = auth.uid()))
  );
CREATE POLICY "Users can update read status" ON public.messages
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND (user_a_id = auth.uid() OR user_b_id = auth.uid()))
  );

-- Blocks policies
CREATE POLICY "Users can insert their own blocks" ON public.blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can see their own blocks" ON public.blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can delete their own blocks" ON public.blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- Reports policies
CREATE POLICY "Users can insert their own reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can see their own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Trigger: auto-create match on mutual like
CREATE OR REPLACE FUNCTION public.check_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.likes WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id) THEN
    INSERT INTO public.matches (user_a_id, user_b_id)
    VALUES (LEAST(NEW.liker_id, NEW.liked_id), GREATEST(NEW.liker_id, NEW.liked_id))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_check_mutual
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_like();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
