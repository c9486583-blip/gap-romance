import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Shield, Filter, Search, Star, SlidersHorizontal, RotateCcw, MapPinOff, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useGeolocation";
import { useGeolocation } from "@/hooks/useGeolocation";

const HOBBY_OPTIONS = [
  "Hiking", "Cooking", "Travel", "Fitness", "Reading", "Gaming",
  "Photography", "Music", "Art", "Dancing", "Yoga", "Foodie",
  "Nightlife", "Sports", "Movies", "Outdoors", "Fashion", "Pets",
  "Volunteering", "Other",
];

const MUSIC_GENRES = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Country", "Jazz", "Classical",
  "Electronic", "Reggae", "Latin", "Gospel", "Alternative", "Indie", "Metal", "Other",
];

const TagFilter = ({
  options, selected, onToggle,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => {
      const isSelected = selected.includes(opt);
      return (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            isSelected
              ? "bg-primary/20 border-primary text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const Discover = () => {
  const { user, profile } = useAuth();
  const { location, requestLocation } = useGeolocation();
  const [showFilters, setShowFilters] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state
  const [modeFilter, setModeFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(80);
  const [distanceRadius, setDistanceRadius] = useState(0); // 0 = Anywhere
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Applied filters (only update on Apply)
  const [appliedFilters, setAppliedFilters] = useState({
    mode: "All",
    verifiedOnly: false,
    ageMin: 18,
    ageMax: 80,
    distance: 0,
    hobbies: [] as string[],
    genres: [] as string[],
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      let query = supabase.from("profiles").select("*").eq("is_verified", true).neq("user_id", user.id);
      const { data } = await query;

      // Filter out blocked users (both directions)
      const { data: blocksOut } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
      const { data: blocksIn } = await supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id);
      const blockedIds = new Set([
        ...(blocksOut || []).map((b: any) => b.blocked_id),
        ...(blocksIn || []).map((b: any) => b.blocker_id),
      ]);

      setProfiles((data || []).filter((p: any) => !blockedIds.has(p.user_id)));
    };
    fetchProfiles();
  }, [user]);

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const applyFilters = () => {
    setAppliedFilters({
      mode: modeFilter,
      verifiedOnly,
      ageMin,
      ageMax,
      distance: distanceRadius,
      hobbies: selectedHobbies,
      genres: selectedGenres,
    });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setModeFilter("All");
    setVerifiedOnly(false);
    setAgeMin(18);
    setAgeMax(80);
    setDistanceRadius(0);
    setSelectedHobbies([]);
    setSelectedGenres([]);
    setAppliedFilters({
      mode: "All",
      verifiedOnly: false,
      ageMin: 18,
      ageMax: 80,
      distance: 0,
      hobbies: [],
      genres: [],
    });
    setShowFilters(false);
  };

  const activeFilterCount = [
    appliedFilters.mode !== "All",
    appliedFilters.verifiedOnly,
    appliedFilters.ageMin !== 18 || appliedFilters.ageMax !== 80,
    appliedFilters.distance > 0,
    appliedFilters.hobbies.length > 0,
    appliedFilters.genres.length > 0,
  ].filter(Boolean).length;

  const getDistance = (p: any) => {
    if (!profile?.latitude || !p.latitude) return null;
    return calculateDistance(profile.latitude, profile.longitude, p.latitude, p.longitude);
  };

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const filtered = profiles.filter((p) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${p.first_name || ""} ${p.last_initial || ""}`.toLowerCase();
      const city = (p.city || "").toLowerCase();
      if (!name.includes(q) && !city.includes(q)) return false;
    }

    // Dating mode
    if (appliedFilters.mode !== "All") {
      const modeMap: Record<string, string> = { Serious: "Serious Dating", Casual: "Casual Dating" };
      const target = modeMap[appliedFilters.mode] || appliedFilters.mode;
      if (p.dating_mode !== target && p.dating_mode !== "Both") return false;
    }

    // Verified only
    if (appliedFilters.verifiedOnly && !p.is_verified) return false;

    // Age range
    const age = getAge(p.date_of_birth);
    if (age !== null) {
      if (age < appliedFilters.ageMin || age > appliedFilters.ageMax) return false;
    }

    // Distance
    if (appliedFilters.distance > 0) {
      const dist = getDistance(p);
      if (dist === null) return false; // no location data
      if (dist > appliedFilters.distance) return false;
    }

    // Hobbies (at least one match)
    if (appliedFilters.hobbies.length > 0) {
      const userHobbies: string[] = p.hobbies || [];
      if (!appliedFilters.hobbies.some((h) => userHobbies.includes(h))) return false;
    }

    // Music genres (at least one match)
    if (appliedFilters.genres.length > 0) {
      const userGenres: string[] = p.favorite_genres || [];
      if (!appliedFilters.genres.some((g) => userGenres.includes(g))) return false;
    }

    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to discover profiles</p>
          <Button variant="hero" asChild><Link to="/login">Log In</Link></Button>
        </div>
      </div>
    );
  }

  if (profile && !profile.is_verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">Verification Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to complete identity verification before you can browse profiles.
          </p>
          <Button variant="hero" asChild>
            <Link to={profile.verification_status === "not_started" ? "/verify-identity" : "/verification-pending"}>
              {profile.verification_status === "not_started" ? "Start Verification" : "Check Status"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/profile">Profile</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/messages">Messages</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/settings">Settings</Link></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Search + Filter toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <Button
            variant={showFilters ? "hero" : "outline"}
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active filters indicator */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filters: <span className="text-primary font-bold">{activeFilterCount} active</span></span>
            <button onClick={resetFilters} className="text-primary text-xs underline ml-2">Clear all</button>
          </div>
        )}

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-6 mb-6 space-y-6">
                {/* Row 1: Age + Distance + Mode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Age Range */}
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-3 block">
                      Age Range
                    </label>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Min: {ageMin}</span>
                        </div>
                        <input
                          type="range"
                          min={18}
                          max={80}
                          value={ageMin}
                          onChange={(e) => {
                            const v = +e.target.value;
                            setAgeMin(v);
                            if (v > ageMax) setAgeMax(v);
                          }}
                          className="w-full accent-primary"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Max: {ageMax}</span>
                        </div>
                        <input
                          type="range"
                          min={18}
                          max={80}
                          value={ageMax}
                          onChange={(e) => {
                            const v = +e.target.value;
                            setAgeMax(v);
                            if (v < ageMin) setAgeMin(v);
                          }}
                          className="w-full accent-primary"
                        />
                      </div>
                      <p className="text-center text-sm font-heading font-bold text-foreground">
                        {ageMin} – {ageMax} years
                      </p>
                    </div>
                  </div>

                  {/* Distance */}
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-3 block">
                      Distance Radius
                    </label>
                    {!profile?.latitude ? (
                      <div className="bg-secondary/50 rounded-xl p-4 text-center">
                        <MapPinOff className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-2">
                          Enable location to filter by distance
                        </p>
                        <Button variant="outline" size="sm" onClick={requestLocation}>
                          <MapPin className="w-3 h-3 mr-1" /> Enable Location
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={distanceRadius}
                          onChange={(e) => setDistanceRadius(+e.target.value)}
                          className="w-full accent-primary"
                        />
                        <p className="text-center text-sm font-heading font-bold text-foreground">
                          {distanceRadius === 0 ? "Anywhere" : `${distanceRadius} miles`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dating Mode */}
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-3 block">
                      Dating Mode
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["All", "Serious", "Casual"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setModeFilter(m)}
                          className={`px-4 py-2 rounded-full text-sm border transition-all ${
                            modeFilter === m
                              ? "bg-primary/20 border-primary text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {m === "All" ? "All" : m === "Serious" ? "Serious Dating" : "Casual Dating"}
                        </button>
                      ))}
                    </div>

                    {/* Verified toggle */}
                    <div className="mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setVerifiedOnly(!verifiedOnly)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            verifiedOnly ? "bg-primary" : "bg-border"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              verifiedOnly ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                        <span className="text-sm text-foreground">Verified only</span>
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Hobbies */}
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-3 block">
                    Hobbies
                  </label>
                  <TagFilter
                    options={HOBBY_OPTIONS}
                    selected={selectedHobbies}
                    onToggle={(v) => setSelectedHobbies(toggleArr(selectedHobbies, v))}
                  />
                </div>

                {/* Music Genres */}
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" /> Music Taste
                  </label>
                  <TagFilter
                    options={MUSIC_GENRES}
                    selected={selectedGenres}
                    onToggle={(v) => setSelectedGenres(toggleArr(selectedGenres, v))}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset Filters
                  </Button>
                  <Button variant="hero" size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground font-heading mb-2">
              {activeFilterCount > 0
                ? "No matches found with these filters"
                : "No profiles found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFilterCount > 0
                ? "Try adjusting your preferences to see more profiles."
                : "Be the first to join!"}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" /> Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Showing <span className="text-foreground font-bold">{filtered.length}</span> profile{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => {
                const age = getAge(p.date_of_birth);
                const dist = getDistance(p);
                const displayName = `${p.first_name || "User"} ${p.last_initial || ""}`.trim();
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl overflow-hidden hover-lift group"
                  >
                    <div className="relative aspect-[4/5] bg-secondary">
                      {p.photos && p.photos[0] ? (
                        <img src={p.photos[0]} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl font-heading">
                          {(p.first_name || "?")[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading text-xl font-bold">
                            {displayName}{age ? `, ${age}` : ""}
                          </h3>
                          {p.is_verified && <Shield className="w-4 h-4 text-gold" />}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                          <MapPin className="w-3 h-3" /> {p.city || "Unknown"}
                          {dist !== null && (
                            <span className="text-primary font-bold">· {dist} mi</span>
                          )}
                        </div>
                        {p.todays_note && (
                          <div className="flex items-center gap-1 text-sm mb-3">
                            <Star className="w-3 h-3 text-primary" />
                            <span className="text-foreground/80">{p.todays_note}</span>
                          </div>
                        )}
                        {p.hobbies && p.hobbies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.hobbies.slice(0, 3).map((h: string) => (
                              <span
                                key={h}
                                className="text-xs bg-secondary/80 px-2 py-0.5 rounded-full text-secondary-foreground"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full border border-border bg-background/50"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                          <Button variant="hero" size="icon" className="rounded-full flex-1">
                            <Heart className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
