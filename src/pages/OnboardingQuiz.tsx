import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/components/OnboardingProgress";

const hobbyOptions = [
  "Hiking", "Running", "Cycling", "Swimming", "Yoga", "Pilates", "Gym & Fitness",
  "Martial Arts", "Rock Climbing", "Skiing & Snowboarding", "Surfing", "Dancing",
  "Golf", "Tennis", "Basketball", "Football", "Soccer", "Baseball", "Volleyball",
  "Bowling", "Fishing", "Hunting", "Camping", "Kayaking", "Skydiving",
  "Horseback Riding", "Cooking", "Baking", "Meal Prepping", "Wine Tasting",
  "Cocktail Making", "Coffee Culture", "Foodie", "Traveling", "Road Trips",
  "Backpacking", "Photography", "Videography", "Painting", "Drawing", "Sculpting",
  "Pottery", "Knitting & Crocheting", "Jewelry Making", "DIY & Home Projects",
  "Gardening", "Interior Design", "Fashion & Style", "Thrifting", "Reading",
  "Writing", "Poetry", "Journaling", "Blogging", "Chess", "Board Games",
  "Video Games", "Trivia", "Puzzles", "Astrology", "Meditation", "Spirituality",
  "Volunteering", "Activism", "Politics", "History", "Science", "Technology",
  "Investing & Finance", "Entrepreneurship", "Real Estate", "Cars & Motorsports",
  "Motorcycles", "Anime", "Comics", "Cosplay", "Theater & Performing Arts",
  "Singing", "Playing an Instrument", "Music Production", "DJing",
  "Concerts & Live Music", "Nightlife", "Clubbing", "Festivals", "Movies",
  "Binge Watching", "Stand-Up Comedy", "Podcasts", "Pets & Animals",
];

const lifestyleOptions = [
  "Homebody", "Adventurer", "Foodie", "Night Owl", "Early Bird", "Gym Rat",
  "Free Spirit", "Hopeless Romantic", "Career Driven", "Entrepreneur",
  "Creative Soul", "Minimalist", "Maximalist", "Party Lover", "Laid Back",
  "Intellectual", "Spiritual", "Family Oriented", "Pet Parent", "Plant Parent",
  "Beach Lover", "City Dweller", "Country Living", "Traveler", "Thrill Seeker",
  "Old Soul", "Social Butterfly", "Introvert", "Extrovert", "Ambivert",
  "Health Conscious", "Fashionista", "Music Lover", "Bookworm", "Gamer",
  "Wine Lover", "Coffee Addict", "Tea Lover", "Sober Lifestyle",
  "Work Hard Play Hard",
];

const personalityOptions = ["Introvert", "Extrovert", "Ambivert"];

const loveLanguages = [
  "Words of Affirmation", "Acts of Service", "Receiving Gifts",
  "Quality Time", "Physical Touch",
];

const cuisines = [
  "Italian", "Japanese", "Mexican", "Thai", "French", "Indian",
  "Mediterranean", "Korean", "American", "Chinese",
];

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

interface QuizStep {
  title: string;
  subtitle: string;
}

const steps: QuizStep[] = [
  { title: "What's your vibe?", subtitle: "Select your personality type" },
  { title: "What do you love?", subtitle: "Pick your hobbies (choose at least 3)" },
  { title: "Your lifestyle", subtitle: "Select badges that describe you" },
  { title: "Music taste", subtitle: "What genres do you vibe with?" },
  { title: "Favorite cuisine", subtitle: "Pick your top cuisines" },
  { title: "Love language", subtitle: "How do you express love?" },
  { title: "What are you looking for?", subtitle: "Your dating intent" },
  { title: "Preferred age range", subtitle: "Set your ideal match age" },
  { title: "Dealbreakers", subtitle: "What's a non-negotiable?" },
  { title: "Prompts", subtitle: "Answer 3 prompts to show your personality" },
  { title: "Vibe check", subtitle: "One last question..." },
];

const musicGenres = [
  "Pop", "R&B", "Hip-Hop", "Rock", "Jazz", "Electronic",
  "Country", "Latin", "Classical", "Indie", "Reggaeton", "Soul",
];

const dealbreakers = [
  "Smoking", "Heavy Drinking", "No Kids", "Wants Kids", "Long Distance",
  "Different Religion", "No Ambition", "Poor Communication",
];

const TagSelect = ({
  options, selected, onToggle, max,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isSelected = selected.includes(opt);
      const disabled = !isSelected && max !== undefined && selected.length >= max;
      return (
        <button
          key={opt}
          onClick={() => !disabled && onToggle(opt)}
          className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${
            isSelected
              ? "bg-primary/20 border-primary text-primary"
              : disabled
              ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const OnboardingQuiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [personality, setPersonality] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [music, setMusic] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [loveLang, setLoveLang] = useState("");
  const [intent, setIntent] = useState("");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60]);
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [vibeAnswer, setVibeAnswer] = useState("");

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const progress = ((step + 1) / steps.length) * 100;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-3">
            {personalityOptions.map((p) => (
              <button
                key={p}
                onClick={() => setPersonality(p)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  personality === p
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span className="font-bold">{p}</span>
              </button>
            ))}
          </div>
        );
      case 1:
        return <TagSelect options={hobbyOptions} selected={hobbies} onToggle={(v) => toggle(hobbies, setHobbies, v)} />;
      case 2:
        return <TagSelect options={lifestyleOptions} selected={lifestyle} onToggle={(v) => toggle(lifestyle, setLifestyle, v)} />;
      case 3:
        return <TagSelect options={musicGenres} selected={music} onToggle={(v) => toggle(music, setMusic, v)} />;
      case 4:
        return <TagSelect options={cuisines} selected={cuisine} onToggle={(v) => toggle(cuisine, setCuisine, v)} />;
      case 5:
        return (
          <div className="flex flex-col gap-3">
            {loveLanguages.map((l) => (
              <button
                key={l}
                onClick={() => setLoveLang(l)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  loveLang === l
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col gap-3">
            {["Serious Dating", "Casual Dating", "Both"].map((i) => (
              <button
                key={i}
                onClick={() => setIntent(i)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  intent === i
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Minimum age: {ageRange[0]}</label>
              <input
                type="range" min={18} max={80} value={ageRange[0]}
                onChange={(e) => setAgeRange([+e.target.value, Math.max(+e.target.value, ageRange[1])])}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Maximum age: {ageRange[1]}</label>
              <input
                type="range" min={18} max={80} value={ageRange[1]}
                onChange={(e) => setAgeRange([Math.min(ageRange[0], +e.target.value), +e.target.value])}
                className="w-full accent-primary"
              />
            </div>
            <p className="text-center text-lg font-heading">
              {ageRange[0]} – {ageRange[1]} years old
            </p>
          </div>
        );
      case 8:
        return <TagSelect options={dealbreakers} selected={selectedDealbreakers} onToggle={(v) => toggle(selectedDealbreakers, setSelectedDealbreakers, v)} />;
      case 9:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Pick up to 3 prompts and answer them</p>
            <TagSelect options={promptOptions} selected={selectedPrompts} onToggle={(v) => toggle(selectedPrompts, setSelectedPrompts, v)} max={3} />
            {selectedPrompts.map((p) => (
              <div key={p} className="mt-3">
                <label className="text-sm text-primary mb-1 block">{p}</label>
                <textarea
                  value={promptAnswers[p] || ""}
                  onChange={(e) => setPromptAnswers({ ...promptAnswers, [p]: e.target.value })}
                  placeholder="Your answer..."
                  className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        );
      case 10:
        return (
          <div>
            <p className="text-muted-foreground mb-4">If your life had a theme song right now, what would it be and why?</p>
            <textarea
              value={vibeAnswer}
              onChange={(e) => setVibeAnswer(e.target.value)}
              placeholder="Mine would be..."
              className="w-full bg-secondary border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground resize-none h-32 focus:outline-none focus:border-primary"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <OnboardingProgress currentStep={2} totalSteps={5} stepLabel="Personality Quiz" />
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-body">Step {step + 1} of {steps.length}</span>
            <span className="text-sm text-primary font-body">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-heading font-bold mb-2">{steps[step].title}</h2>
            <p className="text-muted-foreground mb-8">{steps[step].subtitle}</p>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft className="mr-1" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button variant="hero" onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="ml-1" />
            </Button>
          ) : (
            <Button variant="hero" onClick={() => navigate("/profile-preview", {
              state: {
                quizData: {
                  personality,
                  hobbies,
                  lifestyle,
                  music,
                  cuisine,
                  loveLang,
                  intent,
                  ageRange,
                  dealbreakers: selectedDealbreakers,
                  promptAnswers,
                  vibeAnswer,
                },
              },
            })}>
              <Sparkles className="mr-1" /> Generate My Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuiz;
