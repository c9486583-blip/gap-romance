import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, X, Shield, Star, SlidersHorizontal, RotateCcw, MapPin, MapPinOff, Music, MessageSquare, Filter, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useGeolocation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { HOBBY_OPTIONS, GENRE_OPTIONS } from "@/lib/profile-constants";
import { calculateProfileCompleteness, COMPLETENESS_THRESHOLD } from "@/lib/profile-completeness";
import SwipeCard from "@/components/SwipeCard";
import ExpandedProfile from "@/components/ExpandedProfile";
import MatchCelebration from "@/components/MatchCelebration";
import { useToast } from "@/hooks/use-toast";

const FREE_DAILY_LIKES = 20;

const Discover = () => {
  const { user, profile, subscriptionTier } = useAuth();
  const { location, requestLocation } = useGeolocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isFreeTier = subscriptionTier === "free";

  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedProfile, setExpandedProfile] = useState<any | null>(null);
  const [matchCelebration, setMatchCelebration] = useState<{ profile: any; matchId: string } | null>(null);
  const [likesUsedToday, setLikesUsedToday] = useState(0);
  const [showLikeLimit, setShowLikeLimit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Filter state
  const [modeFilter, setModeFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(80);
  const [distanceRadius, setDistanceRadius] = useState(0);

  const myHobbies: string[] = (profile?.hobbies as string[] | null) || [];
  const myGenres: string[] = (profile?.favorite_genres as string[] | null) || [];

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getDistance = (p: any) => {
    if (!profile?.latitude || !p.latitude) return null;
    return calculateDistance(profile.latitude, profile.longitude, p.latitude, p.longitude);
  };

  // Load today's like count
  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toISOString().split("T")[0];
    supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("liker_id", user.id)
      .gte("created_at", todayStr)
      .then(({ count }) => setLikesUsedToday(count || 0));
  }, [user]);

  const hasActiveFilters = modeFilter !== "All" || verifiedOnly || ageMin !== 18 || ageMax !== 80 || distanceRadius > 0;

  const resetFilters = () => {
    setModeFilter("All");
    setVerifiedOnly(false);
    setAgeMin(18);
    setAgeMax(80);
    setDistanceRadius(0);
  };

  // Fetch profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setFetchError(false);

      try {
        const { data, error: queryError } = await supabase.from("profiles").select("*").neq("user_id", user.id);

        if (queryError) {
          console.error("Failed to fetch profiles:", queryError);
          setFetchError(true);
          setProfiles([]);
          setLoading(false);
          return;
        }

        // Get blocked users
        const { data: blocksOut } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
        const { data: blocksIn } = await supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id);
        const blockedIds = new Set([
          ...(blocksOut || []).map((b: any) => b.blocked_id),
          ...(blocksIn || []).map((b: any) => b.blocker_id),
        ]);

        // Get already liked/passed users
        const { data: likedData } = await supabase.from("likes").select("liked_id").eq("liker_id", user.id);
        const likedIds = new Set((likedData || []).map((l: any) => l.liked_id));

        const filtered = (data || []).filter((p: any) => {
          if (blockedIds.has(p.user_id)) return false;
          if (likedIds.has(p.user_id)) return false;
          const { percentage } = calculateProfileCompleteness(p);
          if (percentage < COMPLETENESS_THRESHOLD) return false;
          return true;
        });

        // Apply filters
        const finalFiltered = filtered.filter((p: any) => {
          if (modeFilter !== "All") {
            const modeMap: Record<string, string> = { Serious: "Serious Dating", Casual: "Casual Dating" };
            const target = modeMap[modeFilter] || modeFilter;
            if (p.dating_mode !== target && p.dating_mode !== "Both") return false;
          }
          if (verifiedOnly && !p.is_verified) return false;
          const age = getAge(p.date_of_birth);
          if (age !== null) {
            if (age < ageMin || age > ageMax) return false;
          }
          if (distanceRadius > 0) {
            const dist = getDistance(p);
            if (dist === null || dist > distanceRadius) return false;
          }
          return true;
        });

        // Shuffle
        for (let i = finalFiltered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [finalFiltered[i], finalFiltered[j]] = [finalFiltered[j], finalFiltered[i]];
        }

        setProfiles(finalFiltered);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Discover fetch error:", err);
        setFetchError(true);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [user, modeFilter, verifiedOnly, ageMin, ageMax, distanceRadius]);

  const canLike = !isFreeTier || likesUsedToday < FREE_DAILY_LIKES;
  const currentProfile = profiles[currentIndex];

  const handleLike = async () => {
    if (!user || !currentProfile) return;
    if (!canLike) {
      setShowLikeLimit(true);
      return;
    }

    setSwipeDirection("right");
    setLikesUsedToday((prev) => prev + 1);

    const { error } = await supabase.from("likes").insert({
      liker_id: user.id,
      liked_id: currentProfile.user_id,
    });

    if (error) {
      toast({ title: "Failed to like", variant: "destructive" });
    } else {
      // Check for mutual like (match) - the trigger handles this, but we check for the celebration
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${currentProfile.user_id}),and(user_a_id.eq.${currentProfile.user_id},user_b_id.eq.${user.id})`)
        .maybeSingle();

      if (match) {
        setMatchCelebration({ profile: currentProfile, matchId: match.id });
      }
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev + 1);
      setExpandedProfile(null);
    }, 300);
  };

  const handlePass = () => {
    if (!currentProfile) return;
    setSwipeDirection("left");
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev + 1);
      setExpandedProfile(null);
    }, 300);
  };

  const handleSuperLike = async () => {
    if (!user || !currentProfile) return;
    if (!canLike) {
      setShowLikeLimit(true);
      return;
    }
    // Super like is a like with a toast
    toast({ title: "⭐ Super Like sent!", description: `${currentProfile.first_name || "They"} will see your Super Like!` });
    await handleLike();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to discover people</p>
          <Button variant="hero" asChild><Link to="/login">Log In</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Compact top bar */}
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img alt="GapRomance logo" className="h-7 w-auto object-contain border-0 rounded-none" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
            <span className="text-xl font-heading font-bold text-gradient whitespace-nowrap">GapRomance</span>
          </Link>
          <div className="flex items-center gap-2">
            {isFreeTier && (
              <span className="text-xs text-muted-foreground">
                {FREE_DAILY_LIKES - likesUsedToday} likes left
              </span>
            )}
            <Button
              variant={showFilters ? "hero" : "ghost"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-2">Age: {ageMin}–{ageMax}</label>
                  <div className="space-y-2">
                    <input type="range" min={18} max={80} value={ageMin} onChange={(e) => { const v = +e.target.value; setAgeMin(v); if (v > ageMax) setAgeMax(v); }} className="w-full accent-primary h-1" />
                    <input type="range" min={18} max={80} value={ageMax} onChange={(e) => { const v = +e.target.value; setAgeMax(v); if (v < ageMin) setAgeMin(v); }} className="w-full accent-primary h-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-2">Distance</label>
                  {!profile?.latitude ? (
                    <Button variant="outline" size="sm" onClick={requestLocation}>
                      <MapPin className="w-3 h-3 mr-1" /> Enable
                    </Button>
                  ) : (
                    <>
                      <input type="range" min={0} max={100} step={5} value={distanceRadius} onChange={(e) => setDistanceRadius(+e.target.value)} className="w-full accent-primary h-1" />
                      <p className="text-xs text-center mt-1">{distanceRadius === 0 ? "Any" : `${distanceRadius} mi`}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-muted-foreground">Mode:</label>
                {["All", "Serious", "Casual"].map((m) => (
                  <button key={m} onClick={() => setModeFilter(m)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${modeFilter === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    {m}
                  </button>
                ))}
                <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                  <div onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${verifiedOnly ? "bg-primary" : "bg-border"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${verifiedOnly ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs">Verified</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe area */}
      <div className="container mx-auto px-4 pt-4">
        <div className="relative mx-auto max-w-sm" style={{ height: "calc(100vh - 230px)", minHeight: "400px" }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          ) : !currentProfile ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <img alt="GapRomance logo" className="h-16 w-auto object-contain mb-6" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
              <h2 className="font-heading text-xl font-bold mb-2">No one here yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Check back soon! New members are joining every day.</p>
              <Button variant="hero" size="sm" onClick={() => setShowFilters(true)}>
                Update Your Preferences
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProfile.user_id}
                className="absolute inset-0"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{
                  x: swipeDirection === "right" ? 400 : swipeDirection === "left" ? -400 : 0,
                  opacity: 0,
                  rotate: swipeDirection === "right" ? 15 : swipeDirection === "left" ? -15 : 0,
                  transition: { duration: 0.3 },
                }}
              >
                <SwipeCard
                  profile={currentProfile}
                  onSwipe={(dir) => dir === "right" ? handleLike() : handlePass()}
                  onTap={() => setExpandedProfile(currentProfile)}
                  myHobbies={myHobbies}
                  getAge={getAge}
                  getDistance={getDistance}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Action buttons */}
        {currentProfile && !loading && (
          <div className="flex items-center justify-center gap-6 mt-4 pb-4">
            <button
              onClick={handlePass}
              className="w-14 h-14 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
            <button
              onClick={handleSuperLike}
              className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Star className="w-6 h-6" />
            </button>
            <button
              onClick={handleLike}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/30"
            >
              <Heart className="w-7 h-7" fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded profile */}
      <AnimatePresence>
        {expandedProfile && (
          <ExpandedProfile
            profile={expandedProfile}
            onClose={() => setExpandedProfile(null)}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLike}
            myHobbies={myHobbies}
            myGenres={myGenres}
            getAge={getAge}
            getDistance={getDistance}
          />
        )}
      </AnimatePresence>

      {/* Match celebration */}
      <AnimatePresence>
        {matchCelebration && (
          <MatchCelebration
            myPhoto={profile?.photos?.[0] || profile?.avatar_url || null}
            theirPhoto={matchCelebration.profile.photos?.[0] || null}
            theirName={matchCelebration.profile.first_name || "Your match"}
            matchId={matchCelebration.matchId}
            onMessage={() => {
              setMatchCelebration(null);
              navigate("/messages", { state: { openMatchId: matchCelebration.matchId } });
            }}
            onKeepSwiping={() => setMatchCelebration(null)}
          />
        )}
      </AnimatePresence>

      {/* Like limit popup */}
      <AnimatePresence>
        {showLikeLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowLikeLimit(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-sm w-full text-center glow-border"
            >
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold mb-2">Out of Likes!</h2>
              <p className="text-muted-foreground mb-6">
                You've used all your likes for today — come back tomorrow or upgrade to Premium for unlimited likes.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="hero" asChild>
                  <Link to="/pricing">Upgrade to Premium</Link>
                </Button>
                <Button variant="ghost" onClick={() => setShowLikeLimit(false)}>
                  Maybe Later
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discover;
