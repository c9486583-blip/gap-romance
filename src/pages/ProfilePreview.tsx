import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Sparkles, ArrowRight, Pencil } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OnboardingProgress from "@/components/OnboardingProgress";

const ProfilePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const quizData = location.state?.quizData;

  const [bio, setBio] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateBio = async () => {
    if (!quizData) {
      toast({ title: "No quiz data found", description: "Please complete the onboarding quiz first.", variant: "destructive" });
      navigate("/onboarding");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-bio", {
        body: { quizData },
      });

      if (error) {
        toast({ title: "Failed to generate bio", description: error.message, variant: "destructive" });
      } else if (data?.bio) {
        setBio(data.bio);
        setHasGenerated(true);
      } else if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setGenerating(false);
  };

  useEffect(() => {
    if (quizData && !hasGenerated) {
      generateBio();
    }
  }, []);

  const saveAndContinue = async () => {
    if (!user || !bio.trim()) return;
    setSaving(true);

    // Save bio + quiz data to profile
    const updateData: Record<string, any> = {
      bio: bio.trim(),
    };

    if (quizData) {
      if (quizData.personality) updateData.personality_badges = [quizData.personality];
      if (quizData.hobbies?.length) updateData.hobbies = quizData.hobbies;
      if (quizData.lifestyle?.length) updateData.lifestyle_badges = quizData.lifestyle;
      if (quizData.music?.length) updateData.favorite_genres = quizData.music;
      if (quizData.cuisine?.length) updateData.favorite_artists = quizData.cuisine; // reusing field
      if (quizData.loveLang) updateData.love_language = quizData.loveLang;
      if (quizData.intent) updateData.dating_mode = quizData.intent;
      if (quizData.dealbreakers?.length) updateData.dealbreakers = quizData.dealbreakers;
      if (quizData.ageRange) {
        updateData.preferred_age_min = quizData.ageRange[0];
        updateData.preferred_age_max = quizData.ageRange[1];
      }
      if (quizData.vibeAnswer) updateData.favorite_song = quizData.vibeAnswer;
      if (quizData.promptAnswers && Object.keys(quizData.promptAnswers).length > 0) {
        updateData.prompt_answers = Object.entries(quizData.promptAnswers).map(([prompt, answer]) => ({
          prompt,
          answer,
        }));
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Failed to save profile", description: error.message, variant: "destructive" });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Your AI-Generated Bio</h1>
          <p className="text-muted-foreground">
            We crafted a bio based on your quiz answers. Feel free to edit it or regenerate a new one.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Writing your bio...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Pencil className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Your bio</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your bio will appear here..."
                className="w-full bg-secondary border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none h-40 focus:outline-none focus:border-primary font-body text-base leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {bio.length} characters
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={generateBio}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
          <Button
            variant="hero"
            className="flex-1"
            onClick={saveAndContinue}
            disabled={saving || generating || !bio.trim()}
          >
            {saving ? (
              <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <>Continue <ArrowRight className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          You can always edit your bio later in Settings.
        </p>
      </motion.div>
    </div>
  );
};

export default ProfilePreview;
