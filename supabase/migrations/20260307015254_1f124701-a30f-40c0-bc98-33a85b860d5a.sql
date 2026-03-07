ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0;

-- Set all existing verified users to fully complete (step 6)
UPDATE public.profiles SET onboarding_step = 6 WHERE is_verified = true AND onboarding_step = 0;

-- Set existing users with bio + photos but not verified to step 4 (profile complete)
UPDATE public.profiles SET onboarding_step = 4 
WHERE is_verified = false 
AND onboarding_step = 0 
AND bio IS NOT NULL 
AND photos IS NOT NULL 
AND array_length(photos, 1) >= 2;