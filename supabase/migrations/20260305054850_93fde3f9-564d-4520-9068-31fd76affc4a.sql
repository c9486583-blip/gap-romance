
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_initial TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('Man', 'Woman')),
  date_of_birth DATE,
  bio TEXT,
  todays_note TEXT,
  dating_mode TEXT CHECK (dating_mode IN ('Serious', 'Casual', 'Both')) DEFAULT 'Both',
  hobbies TEXT[] DEFAULT '{}',
  music_taste TEXT,
  lifestyle_badges TEXT[] DEFAULT '{}',
  personality_badges TEXT[] DEFAULT '{}',
  prompt_answers JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  preferred_age_min INTEGER DEFAULT 18,
  preferred_age_max INTEGER DEFAULT 60,
  love_language TEXT,
  dealbreakers TEXT[] DEFAULT '{}',
  stripe_customer_id TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'premium', 'elite')) DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
