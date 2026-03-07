import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, User, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OnboardingProgress from "@/components/OnboardingProgress";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";

const hobbyOptions = [
  "Hiking", "Running", "Cycling", "Swimming", "Yoga", "Pilates", "Gym & Fitness",
  "Martial Arts", "Rock Climbing", "Skiing & Snowboarding", "Surfing", "Dancing",
  "Golf", "Tennis", "Basketball", "Football", "Soccer", "Baseball", "Volleyball",
  "Cooking", "Baking", "Wine Tasting", "Coffee Culture", "Foodie", "Traveling",
  "Road Trips", "Photography", "Painting", "Drawing", "Gardening", "Reading",
  "Writing", "Chess", "Board Games", "Video Games", "Meditation", "Volunteering",
  "Singing", "Playing an Instrument", "Concerts & Live Music", "Movies",
  "Binge Watching", "Podcasts", "Pets & Animals",
];

const lifestyleOptions = [
  "Homebody", "Adventurer", "Foodie", "Night Owl", "Early Bird", "Gym Rat",
  "Free Spirit", "Hopeless Romantic", "Career Driven", "Entrepreneur",
  "Creative Soul", "Minimalist", "Social Butterfly", "Introvert", "Extrovert",
  "Health Conscious", "Music Lover", "Bookworm", "Traveler", "Old Soul",
];

const personalityOptions = ["Introvert", "Extrovert", "Ambivert"];
const loveLanguages = ["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"];

const TagSelect = ({
  options, selected, onToggle, max,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isSelected = selected.includes(opt);
      const disabled = !isSelected && max !== undefined && selected.length >= max;
      return (
        <button key={opt} onClick={() => !disabled && onToggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-body transition-all border ${
            isSelected ? "bg-primary/20 border-primary text-primary" :
            disabled ? "border-border text-muted-foreground opacity-40 cursor-not-allowed" :
            "border-border text-muted-foreground hover:border-primary/50"
          }`}>
          {opt}
        </button>
      );
    })}
  </div>
);

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [personality, setPersonality] = useState("");
  const [loveLang, setLoveLang] = useState("");
  const [musicTaste, setMusicTaste] = useState("");
  const [datingMode, setDatingMode] = useState("");
  const [todaysNote, setTodaysNote] = useState("");

  // Pre-fill from profile (quiz answers already saved)
  useEffect(() => {
    if (!profile) return;
    if (profile.hobbies?.length) setHobbies(profile.hobbies);
    if (profile.lifestyle_badges?.length) setLifestyle(profile.lifestyle_badges);
    if (profile.personality_badges?.length) setPersonality(profile.personality_badges[0] || "");
    if (profile.love_language) setLoveLang(profile.love_language);
    if (profile.music_taste) setMusicTaste(profile.music_taste);
    if (profile.dating_mode) setDatingMode(profile.dating_mode);
    if (profile.todays_note) setTodaysNote(profile.todays_note);
  }, [profile]);

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  // Calculate profile completeness
  const completeness = useMemo(() => {
    let score = 0;
    const total = 7;
    if (hobbies.length >= 3) score++;
    if (lifestyle.length >= 1) score++;
    if (personality) score++;
    if (loveLang) score++;
    if (datingMode) score++;
    if (profile?.bio) score++;
    if (profile?.photos?.length >= 2) score++;
    return Math.round((score / total) * 100);
  }, [hobbies, lifestyle, personality, loveLang, datingMode, profile]);

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);

    const updateData: any = {
      hobbies,
      lifestyle_badges: lifestyle,
      personality_badges: personality ? [personality] : [],
      love_language: loveLang,
      dating_mode: datingMode,
      todays_note: todaysNote || null,
      todays_note_updated_at: todaysNote ? new Date().toISOString() : null,
      onboarding_step: ONBOARDING_STEPS.PROFILE_COMPLETE,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    navigate("/verify-identity");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pb-20">
      <OnboardingProgress currentStep={4} totalSteps={6} stepLabel="Profile Setup" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mt-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm">Review and customize your profile details. Everything is pre-filled from your quiz answers.</p>
        </div>

        {/* Completeness */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Profile Completeness</span>
            <span className={`text-sm font-bold ${completeness >= 70 ? "text-green-500" : "text-amber-500"}`}>{completeness}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${completeness}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Personality */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Personality Type</h3>
            <div className="flex gap-2">
              {personalityOptions.map((p) => (
                <button key={p} onClick={() => setPersonality(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${personality === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Hobbies & Interests</h3>
            <TagSelect options={hobbyOptions} selected={hobbies} onToggle={(v) => toggle(hobbies, setHobbies, v)} />
          </div>

          {/* Lifestyle */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Lifestyle Badges</h3>
            <TagSelect options={lifestyleOptions} selected={lifestyle} onToggle={(v) => toggle(lifestyle, setLifestyle, v)} />
          </div>

          {/* Love Language */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Love Language</h3>
            <div className="flex flex-wrap gap-2">
              {loveLanguages.map((l) => (
                <button key={l} onClick={() => setLoveLang(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body border transition-all ${loveLang === l ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Dating Mode */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Dating Mode</h3>
            <div className="flex gap-2">
              {["Serious Dating", "Casual Dating", "Both"].map((d) => (
                <button key={d} onClick={() => setDatingMode(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${datingMode === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Today's Note */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-bold mb-1">Today's Note <span className="text-muted-foreground font-normal">(optional)</span></h3>
            <p className="text-xs text-muted-foreground mb-3">Share what's on your mind today</p>
            <textarea value={todaysNote} onChange={(e) => setTodaysNote(e.target.value)} placeholder="Feeling adventurous today..."
              className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:border-primary text-sm" />
          </div>
        </div>

        <Button variant="hero" className="w-full mt-8" onClick={handleContinue} disabled={saving}>
          {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</> :
            <>Continue to Verification <ArrowRight className="ml-2 w-4 h-4" /></>}
        </Button>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
