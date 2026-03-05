import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Shield, Filter, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useGeolocation";

const Discover = () => {
  const { user, profile } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [modeFilter, setModeFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      let query = supabase.from("profiles").select("*").eq("is_verified", true);
      if (user) query = query.neq("user_id", user.id);
      const { data } = await query;
      setProfiles(data || []);
    };
    fetchProfiles();
  }, [user]);

  const filtered = profiles.filter((p) => {
    if (modeFilter !== "All" && p.dating_mode !== modeFilter && p.dating_mode !== "Both") return false;
    if (verifiedOnly && !p.is_verified) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${p.first_name || ""} ${p.last_initial || ""}`.toLowerCase();
      const city = (p.city || "").toLowerCase();
      if (!name.includes(q) && !city.includes(q)) return false;
    }
    return true;
  });

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

  // Block unverified users
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
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <Button variant={showFilters ? "hero" : "outline"} size="lg" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            className="glass rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Dating Mode</label>
              <div className="flex gap-2">
                {["All", "Serious", "Casual"].map((m) => (
                  <button key={m} onClick={() => setModeFilter(m)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${modeFilter === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Options</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="accent-primary w-4 h-4" />
                <span className="text-sm text-foreground">Verified profiles only</span>
              </label>
            </div>
          </motion.div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No profiles found yet. Be the first to join!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => {
              const age = getAge(p.date_of_birth);
              const dist = getDistance(p);
              const displayName = `${p.first_name || "User"} ${p.last_initial || ""}`.trim();
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl overflow-hidden hover-lift group">
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
                        <h3 className="font-heading text-xl font-bold">{displayName}{age ? `, ${age}` : ""}</h3>
                        {p.is_verified && <Shield className="w-4 h-4 text-gold" />}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <MapPin className="w-3 h-3" /> {p.city || "Unknown"}
                        {dist !== null && <span className="text-primary font-bold">· {dist} mi</span>}
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
                            <span key={h} className="text-xs bg-secondary/80 px-2 py-0.5 rounded-full text-secondary-foreground">{h}</span>
                          ))}
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
        )}
      </div>
    </div>
  );
};

export default Discover;
