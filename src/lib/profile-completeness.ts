export const calculateProfileCompleteness = (profile: any): { percentage: number; missing: string[] } => {
  if (!profile) return { percentage: 0, missing: [] };

  const checks: { label: string; filled: boolean }[] = [
    { label: "Display name", filled: !!profile.first_name },
    { label: "Date of birth", filled: !!profile.date_of_birth },
    { label: "Bio", filled: !!profile.bio },
    { label: "At least 1 photo", filled: !!(profile.photos && profile.photos.length > 0) },
    { label: "City / location", filled: !!profile.city },
    { label: "Hobbies (3+)", filled: !!(profile.hobbies && profile.hobbies.length >= 3) },
    { label: "Lifestyle badges", filled: !!(profile.lifestyle_badges && profile.lifestyle_badges.length > 0) },
    { label: "Personality badge", filled: !!(profile.personality_badges && profile.personality_badges.length > 0) },
    { label: "Love language", filled: !!profile.love_language },
    { label: "Prompt answers", filled: !!(profile.prompt_answers && Array.isArray(profile.prompt_answers) && profile.prompt_answers.length > 0) },
  ];

  const filled = checks.filter((c) => c.filled).length;
  const percentage = Math.round((filled / checks.length) * 100);
  const missing = checks.filter((c) => !c.filled).map((c) => c.label);

  return { percentage, missing };
};

export const COMPLETENESS_THRESHOLD = 70;
