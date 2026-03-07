import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OnboardingProgress from "@/components/OnboardingProgress";

// ─── HOBBIES BY CATEGORY ───────────────────────────────────────────────────
const hobbiesByCategory: { category: string; emoji: string; options: string[] }[] = [
  {
    category: "Fitness & Sports", emoji: "🏃",
    options: ["Hiking","Running","Cycling","Swimming","Yoga","Pilates","Gym & Fitness","Martial Arts","Rock Climbing","Skiing & Snowboarding","Surfing","Dancing","Golf","Tennis","Basketball","Football","Soccer","Baseball","Volleyball","Bowling","Kayaking","Skydiving","Horseback Riding"],
  },
  {
    category: "Food & Drink", emoji: "🍳",
    options: ["Cooking","Baking","Meal Prepping","Wine Tasting","Cocktail Making","Coffee Culture","Foodie"],
  },
  {
    category: "Travel & Adventure", emoji: "✈️",
    options: ["Traveling","Road Trips","Backpacking","Camping","Fishing","Hunting"],
  },
  {
    category: "Arts & Creativity", emoji: "🎨",
    options: ["Photography","Videography","Painting","Drawing","Sculpting","Pottery","Knitting & Crocheting","Jewelry Making","DIY & Home Projects","Gardening","Interior Design","Fashion & Style","Thrifting"],
  },
  {
    category: "Mind & Learning", emoji: "📚",
    options: ["Reading","Writing","Poetry","Journaling","Blogging","Chess","Board Games","Trivia","Puzzles","History","Science","Politics","Activism","Volunteering"],
  },
  {
    category: "Tech & Gaming", emoji: "💻",
    options: ["Video Games","Technology","Comics","Cosplay"],
  },
  {
    category: "Music & Entertainment", emoji: "🎵",
    options: ["Singing","Playing an Instrument","Music Production","DJing","Concerts & Live Music","Nightlife","Clubbing","Festivals","Movies","Binge Watching","Stand-Up Comedy","Podcasts","Theater & Performing Arts","Anime"],
  },
  {
    category: "Wellness & Spirituality", emoji: "🙏",
    options: ["Meditation","Spirituality","Astrology","Holistic Living","Health & Wellness"],
  },
  {
    category: "Cars & Motorsports", emoji: "🚗",
    options: ["Cars & Motorsports","Motorcycles"],
  },
  {
    category: "Pets", emoji: "🐾",
    options: ["Dogs","Cats","Birds","Reptiles","Fish & Aquariums","Small Animals","Multiple Pets"],
  },
  {
    category: "Business & Finance", emoji: "💰",
    options: ["Entrepreneurship","Real Estate","Investing & Finance"],
  },
];

// ─── LIFESTYLE BY CATEGORY ─────────────────────────────────────────────────
const lifestyleByCategory: { category: string; emoji: string; options: string[] }[] = [
  { category: "Daily Rhythm", emoji: "🌅", options: ["Night Owl","Early Bird","Laid Back","Free Spirit","Adventurer"] },
  { category: "Ambition & Drive", emoji: "💼", options: ["Career Driven","Work Hard Play Hard","Intellectual"] },
  { category: "Relationship & Social", emoji: "❤️", options: ["Hopeless Romantic","Family Oriented","Social Butterfly","Introvert","Extrovert","Ambivert","Old Soul","Pet Parent","Plant Parent"] },
  { category: "Wellness & Beliefs", emoji: "🙏", options: ["Spiritual","Minimalist","Maximalist","Health Conscious","Sober Lifestyle"] },
  { category: "Vibe & Personality", emoji: "🎉", options: ["Gym Rat","Creative Soul","Party Lover","Thrill Seeker","Fashionista","Music Lover","Bookworm","Gamer","Wine Lover","Coffee Addict","Tea Lover","Traveler","Beach Lover","City Dweller","Country Living"] },
];

// ─── OTHER OPTIONS ──────────────────────────────────────────────────────────
const personalityOptions = [
  { value: "Introvert", desc: "You recharge alone and prefer smaller, deeper connections." },
  { value: "Extrovert", desc: "You thrive around people and get energy from social interactions." },
  { value: "Ambivert", desc: "You're a mix of both — social when you want, quiet when you need." },
];

const loveLanguageOptions = [
  { value: "Words of Affirmation", desc: "You feel loved through compliments, encouragement, and being told how much you mean to someone." },
  { value: "Acts of Service", desc: "You feel loved when someone does things for you — helping out, taking tasks off your plate, showing up." },
  { value: "Receiving Gifts", desc: "You feel loved through thoughtful gifts and gestures — it's the thought behind them that counts." },
  { value: "Quality Time", desc: "You feel loved when someone gives you their full, undivided attention." },
  { value: "Physical Touch", desc: "You feel loved through hugs, hand-holding, closeness, and physical affection." },
];

const datingIntentOptions = [
  { value: "Serious Dating", desc: "You're looking for a committed, long-term relationship — someone to build a future with." },
  { value: "Casual Dating", desc: "You're open to meeting people and seeing where things go, without pressure for commitment right away." },
  { value: "Both", desc: "You're keeping an open mind — the right person and connection will guide where things lead." },
];

const musicGenres = ["Pop","R&B","Hip-Hop","Rock","Jazz","Electronic","Country","Latin","Classical","Indie","Reggaeton","Soul"];

const dealbreakers = ["Smoking","Heavy Drinking","No Kids","Wants Kids","Long Distance","Different Religion","No Ambition","Poor Communication"];

const promptOptions = [
  "A perfect Sunday looks like...",
  "My biggest green flag is...",
  "I'm looking for someone who...",
  "The way to my heart is...",
  "I geek out about...",
  "My most controversial opinion is...",
  "Two truths and a lie...",
  "The key to my heart is...",
];

// ─── CATEGORIZED TAG SELECT ─────────────────────────────────────────────────
const CategoryTagSelect = ({
  categories, selected, onToggle, max,
}: {
  categories: { category: string; emoji: string; options: string[] }[];
  selected: string[];
  onToggle: (v: string) => void;
  max?: number;
}) => (
  <div className="space-y-6">
    {categories.map((cat) => (
      <div key={cat.category}>
        <h3 className="text-sm font-bold text-muted-foreground mb-2">{cat.emoji} {cat.category}</h3>
        <div className="flex flex-wrap gap-2">
          {cat.options.map((opt) => {
            const isSelected = selected.includes(opt);
            const disabled = !isSelected && max !== undefined && selected.length >= max;
            return (
              <button key={opt} onClick={() => !disabled && onToggle(opt)}
                className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${
                  isSelected ? "bg-primary/20 border-primary text-primary"
                  : disabled ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// ─── FLAT TAG SELECT ────────────────────────────────────────────────────────
const TagSelect = ({
  options, selected, onToggle, max,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isSelected = selected.includes(opt);
      const disabled = !isSelected && max !== undefined && selected.length >= max;
      return (
        <button key={opt} onClick={() => !disabled && onToggle(opt)}
          className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${
            isSelected ? "bg-primary/20 border-primary text-primary"
            : disabled ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}>
          {opt}
        </button>
      );
    })}
  </div>
);

// ─── STEPS ──────────────────────────────────────────────────────────────────
const steps = [
  { title: "What's your vibe?", subtitle: "Select your personality type" },
  { title: "What do you love?", subtitle: "Pick your hobbies — choose at least 3" },
  { title: "Your lifestyle", subtitle: "Select badges that describe you" },
  { title: "What are you looking for?", subtitle: "Your dating intent" },
  { title: "Preferred age range", subtitle: "Set your ideal match age" },
  { title: "Top 3 favorite artists", subtitle: "Who do you love listening to?" },
  { title: "Music genres", subtitle: "What genres do you vibe with?" },
  { title: "Favorite song", subtitle: "What's your jam right now?" },
  { title: "Love language", subtitle: "How do you feel most loved?" },
  { title: "Dealbreakers", subtitle: "What's a non-negotiable for you?" },
  { title: "Describe yourself", subtitle: "In your own words, who are you?" },
  { title: "Night owl or early bird?", subtitle: "How do you move through the day?" },
  { title: "What do you do?", subtitle: "Your occupation — completely optional" },
  { title: "Prompts", subtitle: "Answer up to 3 prompts to show your personality" },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const OnboardingQuiz = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [personality, setPersonality] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [music, setMusic] = useState<string[]>([]);
  const [loveLang, setLoveLang] = useState("");
  const [intent, setIntent] = useState("");
  const [ageRange, setAgeRange] = useState<[number, number]>(
    profile?.gender === "Woman" ? [25, 70] : [18, 60]
  );
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [favoriteArtists, setFavoriteArtists] = useState(["", "", ""]);
  const [favoriteSong, setFavoriteSong] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [chronotype, setChronotype] = useState("");
  const [occupation, setOccupation] = useState("");

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const progress = ((step + 1) / steps.length) * 100;
  const ageMin = profile?.gender === "Woman" ? 25 : 18;

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

  const canAdvance = (): boolean => {
    if (step === 0 && !personality) return false;
    if (step === 1 && hobbies.length < 3) return false;
    if (step === 3 && !intent) return false;
    if (step === 8 && !loveLang) return false;
    if (step === 11 && !chronotype) return false;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        personality_badges: personality ? [personality] : [],
        hobbies,
        lifestyle_badges: lifestyle,
        favorite_genres: music,
        love_language: loveLang,
        dating_mode: intent,
        preferred_age_min: ageRange[0],
        preferred_age_max: ageRange[1],
        dealbreakers: selectedDealbreakers,
        prompt_answers: promptAnswers,
        favorite_artists: favoriteArtists.filter((a) => a.trim()),
        favorite_song: favoriteSong.trim() || null,
        bio: selfDescription.trim() || null,
        music_taste: chronotype,
        occupation: occupation.trim() || null,
        onboarding_step: 2,
      } as any).eq("user_id", user.id);

      if (error) {
        toast({ title: "Failed to save quiz", description: error.message, variant: "destructive" });
        return;
      }

      await refreshProfile();
      navigate("/profile-setup");
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-3">
            {personalityOptions.map((p) => (
              <button key={p.value} onClick={() => setPersonality(p.value)}
                className={`p-4 rounded-xl border text-left transition-all ${personality === p.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <span className="font-bold text-foreground block">{p.value}</span>
                <span className="text-sm text-muted-foreground mt-0.5 block">{p.desc}</span>
              </button>
            ))}
          </div>
        );

      case 1:
        return (
          <div>
            <p className="text-xs text-muted-foreground mb-4">Selected: {hobbies.length} — pick at least 3</p>
            <CategoryTagSelect categories={hobbiesByCategory} selected={hobbies} onToggle={(v) => toggle(hobbies, setHobbies, v)} />
          </div>
        );

      case 2:
        return (
          <div>
            <p className="text-xs text-muted-foreground mb-4">Selected: {lifestyle.length}</p>
            <CategoryTagSelect categories={lifestyleByCategory} selected={lifestyle} onToggle={(v) => toggle(lifestyle, setLifestyle, v)} />
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col gap-3">
            {datingIntentOptions.map((i) => (
              <button key={i.value} onClick={() => setIntent(i.value)}
                className={`p-4 rounded-xl border text-left transition-all ${intent === i.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <span className="font-bold text-foreground block">{i.value}</span>
                <span className="text-sm text-muted-foreground mt-0.5 block">{i.desc}</span>
              </button>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {profile?.gender === "Woman"
                ? "You're looking for men. Men on GapRomance must be at least 25."
                : "You're looking for women. Women on GapRomance must be at least 18."}
            </p>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Minimum age: {ageRange[0]}</label>
              <input type="range" min={ageMin} max={80} value={ageRange[0]}
                onChange={(e) => setAgeRange([+e.target.value, Math.max(+e.target.value, ageRange[1])])}
                className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Maximum age: {ageRange[1]}</label>
              <input type="range" min={ageMin} max={80} value={ageRange[1]}
                onChange={(e) => setAgeRange([Math.min(ageRange[0], +e.target.value), +e.target.value])}
                className="w-full accent-primary" />
            </div>
            <p className="text-center text-lg font-heading">{ageRange[0]} – {ageRange[1]} years old</p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <input key={i} value={favoriteArtists[i]} onChange={(e) => {
                const updated = [...favoriteArtists];
                updated[i] = e.target.value;
                setFavoriteArtists(updated);
              }} placeholder={`Artist ${i + 1}`} className={inputClass} />
            ))}
          </div>
        );

      case 6:
        return <TagSelect options={musicGenres} selected={music} onToggle={(v) => toggle(music, setMusic, v)} />;

      case 7:
        return (
          <input value={favoriteSong} onChange={(e) => setFavoriteSong(e.target.value)}
            placeholder="Song title — Artist" className={inputClass} />
        );

      case 8:
        return (
          <div className="flex flex-col gap-3">
            {loveLanguageOptions.map((l) => (
              <button key={l.value} onClick={() => setLoveLang(l.value)}
                className={`p-4 rounded-xl border text-left transition-all ${loveLang === l.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <span className="font-bold text-foreground block">{l.value}</span>
                <span className="text-sm text-muted-foreground mt-0.5 block">{l.desc}</span>
              </button>
            ))}
          </div>
        );

      case 9:
        return <TagSelect options={dealbreakers} selected={selectedDealbreakers} onToggle={(v) => toggle(selectedDealbreakers, setSelectedDealbreakers, v)} />;

      case 10:
        return (
          <textarea value={selfDescription} onChange={(e) => setSelfDescription(e.target.value)}
            placeholder="I'm someone who..." maxLength={300}
            className="w-full bg-secondary border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground resize-none h-28 focus:outline-none focus:border-primary" />
        );

      case 11:
        return (
          <div className="flex flex-col gap-3">
            {[
              { value: "Night Owl", desc: "You come alive after dark and do your best living at night." },
              { value: "Early Bird", desc: "You're up with the sun and love making the most of the morning." },
              { value: "Depends on the day", desc: "You go with the flow — some days early, some days late." },
            ].map((c) => (
              <button key={c.value} onClick={() => setChronotype(c.value)}
                className={`p-4 rounded-xl border text-left transition-all ${chronotype === c.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <span className="font-bold text-foreground block">{c.value}</span>
                <span className="text-sm text-muted-foreground mt-0.5 block">{c.desc}</span>
              </button>
            ))}
          </div>
        );

      case 12:
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">This is completely optional. Share your job title, industry, or just leave it blank — it's up to you.</p>
            </div>
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Nurse, Software Engineer, Business Owner..."
              maxLength={60} className={inputClass} />
          </div>
        );

      case 13:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Pick up to 3 prompts and answer them — this is how others get to know the real you.</p>
            <TagSelect options={promptOptions} selected={selectedPrompts} onToggle={(v) => toggle(selectedPrompts, setSelectedPrompts, v)} max={3} />
            {selectedPrompts.map((p) => (
              <div key={p} className="mt-3">
                <label className="text-sm text-primary mb-1 block">{p}</label>
                <textarea value={promptAnswers[p] || ""} onChange={(e) => setPromptAnswers({ ...promptAnswers, [p]: e.target.value })}
                  placeholder="Your answer..." maxLength={200}
                  className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:border-primary" />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <OnboardingProgress currentStep={2} totalSteps={5} stepLabel="Personality Quiz" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-body">Question {step + 1} of {steps.length}</span>
              <span className="text-sm text-primary font-body">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-heading font-bold mb-2">{steps[step].title}</h2>
              <p className="text-muted-foreground mb-8">{steps[step].subtitle}</p>
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-10">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ChevronLeft className="mr-1" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button variant="hero" onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
                Next <ChevronRight className="ml-1" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleFinish} disabled={saving}>
                {saving ? "Saving..." : <><Sparkles className="mr-1" /> Finish Quiz</>}
              </Button>
            )}
          </div>

          {!canAdvance() && step !== steps.length - 1 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              {step === 1 ? "Please select at least 3 hobbies to continue." : "Please make a selection to continue."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuiz;
