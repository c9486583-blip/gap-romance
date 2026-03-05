ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS favorite_artists text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS favorite_genres text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS favorite_song text DEFAULT NULL;