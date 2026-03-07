import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, X, Star, SlidersHorizontal, RotateCcw, ChevronDown, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance, useGeolocation } from "@/hooks/useGeolocation";
import { calculateProfileCompleteness, COMPLETENESS_THRESHOLD } from "@/lib/profile-completeness";
import SwipeCard from "@/components/SwipeCard";
import ExpandedProfile from "@/components/ExpandedProfile";
import MatchCelebration from "@/components/MatchCelebration";
import { useToast } from "@/hooks/use-toast";

const FREE_DAILY_LIKES = 20;
const MIN_PHOTOS_REQUIRED = 2;

const SORT_OPTIONS = [
  { value: "distance", label: "Nearest First" },
  { value: "active",   label: "Recently Active" },
  { value: "newest",   label: "Newest Members" },
];

const HOBBY_CATEGORIES = [
  { emoji: "🏃", options: ["Hiking","Running","Cycling","Swimming","Yoga","Gym & Fitness","Dancing","Tennis","Basketball"] },
  { emoji: "🍳", options: ["Cooking","Baking","Foodie","Wine Tasting","Coffee Culture"] },
  { emoji: "✈️", options: ["Traveling","Road Trips","Camping","Backpacking"] },
  { emoji: "🎨", options: ["Photography","Painting","Drawing","Fashion & Style","Gardening"] },
  { emoji: "📚", options: ["Reading","Writing","Chess","Trivia","History"] },
  { emoji: "💻", options: ["Video Games","Technology","Comics"] },
  { emoji: "🎵", options: ["Concerts & Live Music","Singing","Playing an Instrument","Movies","Anime"] },
  { emoji: "🐾", options: ["Dogs","Cats","Pets"] },
  { emoji: "💰", options: ["Entrepreneurship","Investing & Finance","Real Estate"] },
];

const Discover = () => {
  const { user, profile, subscriptionTier } = useAuth();
  const { requestLocation } = useGeolocation();
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

  const [sortBy, setSortBy] = useState<"distance" | "active" | "newest">("distance");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(80);
  const [minAgeGap, setMinAgeGap] = useState(0);
  const [distanceRadius, setDistanceRadius] = useState(0);
  const [modeFilter, setModeFilter] = useState("All");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [showHobbyPicker, setShowHobbyPicker] = useState(false);

  const myGender = profile?.gender as string | null;
  const myAge = (() => {
    if (!profile?.date_of_birth) return null;
    const b = new Date(profile.date_of_birth);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
  })();
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

  const hasActiveFilters =
    sortBy !== "distance" ||
    ageMin !== 18 || ageMax !== 80 ||
    minAgeGap > 0 ||
    distanceRadius > 0 ||
    modeFilter !== "All" ||
    selectedHobbies.length > 0;

  const resetFilters = () => {
    setSortBy("distance");
    setAgeMin(18);
    setAgeMax(80);
    setMinAgeGap(0);
    setDistanceRadius(0);
    setModeFilter("All");
    setSelectedHobbies([]);
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      setFetchError(false);

      try {
        const { data, error: queryError } = await supabase.from("profiles").select("*").neq("user_id", user.id);
        if (queryError) { setFetchError(true); setProfiles([]); setLoading(false); return; }

        const { data: blocksOut } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
        const { data: blocksIn }  = await supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id);
        const blockedIds = new Set([
          ...(blocksOut || []).map((b: any) => b.blocked_id),
          ...(blocksIn  || []).map((b: any) => b.blocker_id),
        ]);

        const { data: likedData } = await supabase.from("likes").select("liked_id").eq("liker_id", user.id);
        const likedIds = new Set((likedData || []).map((l: any) => l.liked_id));

        const oppositeGender = myGender === "Man" ? "Woman" : myGender === "Woman" ? "Man" : null;
        const absoluteAgeMin = myGender === "Woman" ? 25 : 18;

        let filtered = (data || []).filter((p: any) => {
          if (blockedIds.has(p.user_id)) return false;
          if (likedIds.has(p.user_id))   return false;
          const photos: string[] = (p.photos as string[] | null) || [];
          if (photos.length < MIN_PHOTOS_REQUIRED) return false;
          const { percentage } = calculateProfileCompleteness(p);
          if (percentage < COMPLETENESS_THRESHOLD) return false;
          if (oppositeGender && p.gender !== oppositeGender) return false;
          const age = getAge(p.date_of_birth);
          if (age !== null && age < absoluteAgeMin) return false;
          return true;
        });

        filtered = filtered.filter((p: any) => {
          const age = getAge(p.date_of_birth);
          if (age !== null && (age < ageMin || age > ageMax)) return false;
          if (minAgeGap > 0 && myAge !== null && age !== null) {
            if (Math.abs(myAge - age) < minAgeGap) return false;
          }
          if (distanceRadius > 0) {
            const dist = getDistance(p);
            if (dist === null || dist > distanceRadius) return false;
          }
          if (modeFilter !== "All") {
            const modeMap: Record<string, string> = { Serious: "Serious Dating", Casual: "Casual Dating" };
            const target = modeMap[modeFilter] || modeFilter;
            if (p.dating_mode !== target && p.dating_mode !== "Both") return false;
          }
          if (selectedHobbies.length > 0) {
            const theirHobbies: string[] = (p.hobbies as string[] | null) || [];
            if (!selectedHobbies.some((h) => theirHobbies.includes(h))) return false;
          }
          return true;
        });

        if (sortBy === "distance") {
          filtered.sort((a: any, b: any) => {
            const da = getDistance(a), db = getDistance(b);
            if (da === null && db === null) return 0;
            if (da === null) return 1;
            if (db === null) return -1;
            return da - db;
          });
        } else if (sortBy === "active") {
          filtered.sort((a: any, b: any) => {
            const ta = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
            const tb = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
            return tb - ta;
          });
        } else if (sortBy === "newest") {
          filtered.sort((a: any, b: any) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
          });
        }

        setProfiles(filtered);
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
  }, [user, myGender, myAge, sortBy, ageMin, ageMax, minAgeGap, distanceRadius, modeFilter, selectedHobbies]);

  const canLike = !isFreeTier || likesUsedToday < FREE_DAILY_LIKES;
  const currentProfile = profiles[currentIndex];

  const handleLike = async () => {
    if (!user || !currentProfile) return;
    if (!canLike) { setShowLikeLimit(true); return; }
    setSwipeDirection("right");
    setLikesUsedToday((prev) => prev + 1);
    const { error } = await supabase.from("likes").insert({ liker_id: user.id, liked_id: currentProfile.user_id });
    if (error) {
      toast({ title: "Failed to like", variant: "destructive" });
    } else {
      const { data: match } = await supabase.from("matches").select("id")
        .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${currentProfile.user_id}),and(user_a_id.eq.${currentProfile.user_id},user_b_id.eq.${user.id})`)
        .maybeSingle();
      if (match) setMatchCelebration({ profile: currentProfile, matchId: match.id });
    }
    setTimeout(() => { setSwipeDirection(null); setCurrentIndex((p) => p + 1); setExpandedProfile(null); }, 300);
  };

  const handlePass = () => {
    if (!currentProfile) return;
    setSwipeDirection("left");
    setTimeout(() => { setSwipeDirection(null); setCurrentIndex((p) => p + 1); setExpandedProfile(null); }, 300);
  };

  const handleSuperLike = async () => {
    if (!user || !currentProfile) return;
    if (!canLike) { setShowLikeLimit(true); return; }
    toast({ title: "⭐ Super Like sent!", description: `${currentProfile.first_name || "They"} will see your Super Like!` });
    await handleLike();
  };

  const toggleHobby = (h: string) =>
    setSelectedHobbies((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]);

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

      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img alt="GapRomance logo" className="h-7 w-auto object-contain" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
            <span className="text-xl font-heading font-bold text-gradient whitespace-nowrap">GapRomance</span>
          </Link>
          <div className="flex items-center gap-2">
            {isFreeTier && (
              <span className="text-xs text-muted-foreground">{FREE_DAILY_LIKES - likesUsedToday} likes left</span>
            )}
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            <Button variant={showFilters ? "hero" : "ghost"} size="icon" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30 bg-background/95 backdrop-blur-sm"
          >
            <div className="container mx-auto px-4 py-5 space-y-5 max-w-lg">

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">Sort By</label>
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map((s) => (
                    <button key={s.value} onClick={() => setSortBy(s.value as any)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${sortBy === s.value ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">
                  Distance: {distanceRadius === 0 ? "Any" : `within ${distanceRadius} miles`}
                </label>
                {!profile?.latitude ? (
                  <button onClick={requestLocation}
                    className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/10 transition-all">
                    <MapPin className="w-3.5 h-3.5" /> Enable location for distance filtering
                  </button>
                ) : (
                  <input type="range" min={0} max={150} step={5} value={distanceRadius}
                    onChange={(e) => setDistanceRadius(+e.target.value)}
                    className="w-full accent-primary h-1" />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">Age Range: {ageMin}–{ageMax}</label>
                <div className="space-y-1.5">
                  <input type="range" min={18} max={80} value={ageMin}
                    onChange={(e) => { const v = +e.target.value; setAgeMin(v); if (v > ageMax) setAgeMax(v); }}
                    className="w-full accent-primary h-1" />
                  <input type="range" min={18} max={80} value={ageMax}
                    onChange={(e) => { const v = +e.target.value; setAgeMax(v); if (v < ageMin) setAgeMin(v); }}
                    className="w-full accent-primary h-1" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">
                  Minimum Age Gap: {minAgeGap === 0 ? "Any" : `${minAgeGap}+ years`}
                </label>
                <input type="range" min={0} max={30} step={1} value={minAgeGap}
                  onChange={(e) => setMinAgeGap(+e.target.value)}
                  className="w-full accent-primary h-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {minAgeGap === 0
                    ? "Showing all age differences"
                    : `Only showing people at least ${minAgeGap} years ${myAge ? "older or younger than you" : "apart"}`}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs font-bold text-muted-foreground">Intent:</label>
                {["All", "Serious", "Casual"].map((m) => (
                  <button key={m} onClick={() => setModeFilter(m)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${modeFilter === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    {m}
                  </button>
                ))}
              </div>

              <div>
                <button onClick={() => setShowHobbyPicker(!showHobbyPicker)}
                  className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-2 hover:text-foreground transition-colors w-full text-left">
                  Shared Hobbies
                  {selectedHobbies.length > 0 && <span className="text-primary">({selectedHobbies.length} selected)</span>}
                  <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showHobbyPicker ? "rotate-180" : ""}`} />
                </button>
                {showHobbyPicker && (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {HOBBY_CATEGORIES.map((cat) => (
                      <div key={cat.emoji}>
                        <p className="text-xs text-muted-foreground mb-1">{cat.emoji}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.options.map((opt) => {
                            const sel = selectedHobbies.includes(opt);
                            return (
                              <button key={opt} onClick={() => toggleHobby(opt)}
                                className={`px-2.5 py-1 rounded-full text-xs border transition-all ${sel ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-4">
        <div className="relative mx-auto max-w-sm" style={{ height: "calc(100vh - 230px)", minHeight: "400px" }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <img alt="GapRomance logo" className="h-16 w-auto object-contain mb-6" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
              <h2 className="font-heading text-xl font-bold text-primary mb-2">Something went wrong</h2>
              <p className="text-muted-foreground text-sm mb-6">We couldn't load profiles right now. Please try again.</p>
              <Button variant="hero" size="sm" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : !currentProfile && hasActiveFilters ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <img alt="GapRomance logo" className="h-16 w-auto object-contain mb-6" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
              <h2 className="font-heading text-xl font-bold text-primary mb-2">No results</h2>
              <p className="text-muted-foreground text-sm mb-6">No members match your current filters — try adjusting them.</p>
              <Button variant="hero" size="sm" onClick={resetFilters}><RotateCcw className="w-3 h-3 mr-1" /> Reset Filters</Button>
            </div>
          ) : !currentProfile ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <img alt="GapRomance logo" className="h-16 w-auto object-contain mb-6" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
              <h2 className="font-heading text-xl font-bold text-primary mb-2">You're all caught up</h2>
              <p className="text-muted-foreground text-sm mb-6">No new members nearby right now — check back soon!</p>
              <Button variant="hero" size="sm" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="w-3 h-3 mr-1" /> Adjust Filters
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={currentProfile.user_id} className="absolute inset-0"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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

        {currentProfile && !loading && (
          <div className="flex items-center justify-center gap-6 mt-4 pb-4">
            <button onClick={handlePass}
              className="w-14 h-14 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors">
              <X className="w-7 h-7" />
            </button>
            <button onClick={handleSuperLike}
              className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              <Star className="w-6 h-6" />
            </button>
            <button onClick={handleLike}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/30">
              <Heart className="w-7 h-7" fill="currentColor" />
            </button>
          </div>
        )}
      </div>

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

      <AnimatePresence>
        {showLikeLimit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowLikeLimit(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-sm w-full text-center glow-border">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold mb-2">Out of Likes!</h2>
              <p className="text-muted-foreground mb-6">
                You've used all {FREE_DAILY_LIKES} likes for today. Come back tomorrow or upgrade for unlimited likes.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="hero" asChild><Link to="/pricing">Upgrade to Premium</Link></Button>
                <Button variant="ghost" onClick={() => setShowLikeLimit(false)}>Maybe Later</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Discover;
