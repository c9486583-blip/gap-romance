import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Shield, Filter, Search, SlidersHorizontal, RotateCcw, MapPinOff, Music, MessageSquare, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useGeolocation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { HOBBY_OPTIONS, GENRE_OPTIONS, LIFESTYLE_ICONS } from "@/lib/profile-constants";
import { calculateProfileCompleteness, COMPLETENESS_THRESHOLD } from "@/lib/profile-completeness";

const TagFilter = ({
  options, selected, onToggle,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => {
      const isSelected = selected.includes(opt);
      return (
        <button key={opt} onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            isSelected ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
          }`}>
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

  const [modeFilter, setModeFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasNoteOnly, setHasNoteOnly] = useState(false);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(80);
  const [distanceRadius, setDistanceRadius] = useState(0);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [appliedFilters, setAppliedFilters] = useState({
    mode: "All", verifiedOnly: false, hasNoteOnly: false,
    ageMin: 18, ageMax: 80, distance: 0,
    hobbies: [] as string[], genres: [] as string[],
  });

  const myHobbies: string[] = (profile?.hobbies as string[] | null) || [];
  const myGenres: string[] = (profile?.favorite_genres as string[] | null) || [];

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      let query = supabase.from("profiles").select("*").neq("user_id", user.id);
      const { data } = await query;

      const { data: blocksOut } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
      const { data: blocksIn } = await supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id);
      const blockedIds = new Set([
        ...(blocksOut || []).map((b: any) => b.blocked_id),
        ...(blocksIn || []).map((b: any) => b.blocker_id),
      ]);

      // Filter out blocked users and incomplete profiles
      setProfiles((data || []).filter((p: any) => {
        if (blockedIds.has(p.user_id)) return false;
        const { percentage } = calculateProfileCompleteness(p);
        return percentage >= COMPLETENESS_THRESHOLD;
      }));
    };
    fetchProfiles();
  }, [user]);

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const applyFilters = () => {
    setAppliedFilters({
      mode: modeFilter, verifiedOnly, hasNoteOnly,
      ageMin, ageMax, distance: distanceRadius,
      hobbies: selectedHobbies, genres: selectedGenres,
    });
    setShowFilters(false);
  };

  const isNoteActive = (p: any) => {
    if (!p.todays_note || !p.todays_note_updated_at) return false;
    return Date.now() - new Date(p.todays_note_updated_at).getTime() < 24 * 60 * 60 * 1000;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return "";
  };

  const resetFilters = () => {
    setModeFilter("All"); setVerifiedOnly(false); setHasNoteOnly(false);
    setAgeMin(18); setAgeMax(80); setDistanceRadius(0);
    setSelectedHobbies([]); setSelectedGenres([]);
    setAppliedFilters({
      mode: "All", verifiedOnly: false, hasNoteOnly: false,
      ageMin: 18, ageMax: 80, distance: 0, hobbies: [], genres: [],
    });
    setShowFilters(false);
  };

  const activeFilterCount = [
    appliedFilters.mode !== "All", appliedFilters.verifiedOnly, appliedFilters.hasNoteOnly,
    appliedFilters.ageMin !== 18 || appliedFilters.ageMax !== 80,
    appliedFilters.distance > 0, appliedFilters.hobbies.length > 0, appliedFilters.genres.length > 0,
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

  const getDatingModeLabel = (mode: string | null) => {
    if (mode === "Serious Dating") return "Serious Dating";
    if (mode === "Casual Dating") return "Casual Dating";
    return "Open to Both";
  };

  const filtered = profiles.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${p.first_name || ""} ${p.last_initial || ""}`.toLowerCase();
      const city = (p.city || "").toLowerCase();
      if (!name.includes(q) && !city.includes(q)) return false;
    }
    if (appliedFilters.mode !== "All") {
      const modeMap: Record<string, string> = { Serious: "Serious Dating", Casual: "Casual Dating" };
      const target = modeMap[appliedFilters.mode] || appliedFilters.mode;
      if (p.dating_mode !== target && p.dating_mode !== "Both") return false;
    }
    if (appliedFilters.verifiedOnly && !p.is_verified) return false;
    if (appliedFilters.hasNoteOnly && !isNoteActive(p)) return false;
    const age = getAge(p.date_of_birth);
    if (age !== null) {
      if (age < appliedFilters.ageMin || age > appliedFilters.ageMax) return false;
    }
    if (appliedFilters.distance > 0) {
      const dist = getDistance(p);
      if (dist === null || dist > appliedFilters.distance) return false;
    }
    if (appliedFilters.hobbies.length > 0) {
      const userHobbies: string[] = p.hobbies || [];
      if (!appliedFilters.hobbies.some((h) => userHobbies.includes(h))) return false;
    }
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
          <p className="text-muted-foreground mb-6">You need to complete identity verification before you can browse profiles.</p>
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
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <Button variant={showFilters ? "hero" : "outline"} size="lg" onClick={() => setShowFilters(!showFilters)} className="relative">
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

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
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="glass rounded-2xl p-6 mb-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Age Range */}
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-3 block">Age Range</label>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Min: {ageMin}</span></div>
                        <input type="range" min={18} max={80} value={ageMin} onChange={(e) => { const v = +e.target.value; setAgeMin(v); if (v > ageMax) setAgeMax(v); }} className="w-full accent-primary" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Max: {ageMax}</span></div>
                        <input type="range" min={18} max={80} value={ageMax} onChange={(e) => { const v = +e.target.value; setAgeMax(v); if (v < ageMin) setAgeMin(v); }} className="w-full accent-primary" />
                      </div>
                      <p className="text-center text-sm font-heading font-bold text-foreground">{ageMin} – {ageMax} years</p>
                    </div>
                  </div>

                  {/* Distance */}
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-3 block">Distance Radius</label>
                    {!profile?.latitude ? (
                      <div className="bg-secondary/50 rounded-xl p-4 text-center">
                        <MapPinOff className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-2">Enable location to filter by distance</p>
                        <Button variant="outline" size="sm" onClick={requestLocation}>
                          <MapPin className="w-3 h-3 mr-1" /> Enable Location
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input type="range" min={0} max={100} step={5} value={distanceRadius} onChange={(e) => setDistanceRadius(+e.target.value)} className="w-full accent-primary" />
                        <p className="text-center text-sm font-heading font-bold text-foreground">
                          {distanceRadius === 0 ? "Anywhere" : `${distanceRadius} miles`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dating Mode */}
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-3 block">Dating Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {["All", "Serious", "Casual"].map((m) => (
                        <button key={m} onClick={() => setModeFilter(m)}
                          className={`px-4 py-2 rounded-full text-sm border transition-all ${
                            modeFilter === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                          }`}>
                          {m === "All" ? "All" : m === "Serious" ? "Serious Dating" : "Casual Dating"}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setVerifiedOnly(!verifiedOnly)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${verifiedOnly ? "bg-primary" : "bg-border"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${verifiedOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-sm text-foreground">Verified only</span>
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setHasNoteOnly(!hasNoteOnly)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${hasNoteOnly ? "bg-primary" : "bg-border"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasNoteOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-sm text-foreground">Has Today's Note</span>
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-3 block">Hobbies</label>
                  <TagFilter options={HOBBY_OPTIONS} selected={selectedHobbies} onToggle={(v) => setSelectedHobbies(toggleArr(selectedHobbies, v))} />
                </div>

                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" /> Music Taste
                  </label>
                  <TagFilter options={GENRE_OPTIONS} selected={selectedGenres} onToggle={(v) => setSelectedGenres(toggleArr(selectedGenres, v))} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset Filters
                  </Button>
                  <Button variant="hero" size="sm" onClick={applyFilters}>Apply Filters</Button>
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
              {activeFilterCount > 0 ? "No matches found with these filters" : "No profiles found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFilterCount > 0 ? "Try adjusting your preferences to see more profiles." : "Be the first to join!"}
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
                const profileHobbies: string[] = p.hobbies || [];
                const profileGenres: string[] = p.favorite_genres || [];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} className="glass rounded-xl overflow-hidden hover-lift group">
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
                          {p.is_verified && <Shield className="w-4 h-4 text-primary" />}
                        </div>

                        {/* Dating mode badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                            {getDatingModeLabel(p.dating_mode)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                          <MapPin className="w-3 h-3" /> {p.city || "Unknown"}
                          {dist !== null && (
                            <span className="text-primary font-bold">· {dist} mi</span>
                          )}
                        </div>

                        {isNoteActive(p) && (
                          <div className="flex items-start gap-1.5 text-sm mb-2">
                            <MessageSquare className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-primary/90 italic">{p.todays_note}</span>
                              {p.todays_note_updated_at && (
                                <span className="text-xs text-muted-foreground ml-1.5">{getTimeAgo(p.todays_note_updated_at)}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hobbies with match highlighting */}
                        {profileHobbies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {profileHobbies.slice(0, 4).map((h: string) => {
                              const isShared = myHobbies.includes(h);
                              return (
                                <span key={h} className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                  isShared
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-secondary/80 text-secondary-foreground"
                                }`}>
                                  {h}
                                </span>
                              );
                            })}
                            {profileHobbies.length > 4 && (
                              <span className="text-xs text-muted-foreground px-1">+{profileHobbies.length - 4}</span>
                            )}
                          </div>
                        )}

                        {/* Genre tags with match highlighting */}
                        {profileGenres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {profileGenres.slice(0, 3).map((g: string) => {
                              const isShared = myGenres.includes(g);
                              return (
                                <span key={g} className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${
                                  isShared
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-secondary/80 text-secondary-foreground"
                                }`}>
                                  <Music className="w-2.5 h-2.5" /> {g}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-full border border-border bg-background/50">
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
