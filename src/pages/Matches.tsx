import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Shield, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface MatchItem {
  matchId: string;
  partnerId: string;
  partnerName: string;
  partnerAge: number | null;
  partnerPhoto: string | null;
  partnerVerified: boolean;
  hasBeenMessaged: boolean;
  createdAt: string;
}

const Matches = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    const { data: matchRows } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!matchRows || matchRows.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const partnerIds = matchRows.map((m: any) => m.user_a_id === user.id ? m.user_b_id : m.user_a_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_initial, avatar_url, photos, is_verified, date_of_birth")
      .in("user_id", partnerIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const matchList: MatchItem[] = [];
    for (const m of matchRows) {
      const partnerId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
      const prof = profileMap.get(partnerId);

      // Check if any messages exist
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("match_id", m.id);

      const photo = prof?.photos?.[0] || prof?.avatar_url || null;

      matchList.push({
        matchId: m.id,
        partnerId,
        partnerName: prof ? `${prof.first_name || "User"} ${prof.last_initial || ""}`.trim() : "User",
        partnerAge: prof ? getAge(prof.date_of_birth) : null,
        partnerPhoto: photo,
        partnerVerified: prof?.is_verified || false,
        hasBeenMessaged: (count || 0) > 0,
        createdAt: m.created_at,
      });
    }

    setMatches(matchList);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view matches</p>
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
            <img alt="GapRomance logo" className="h-7 w-auto object-contain border-0 rounded-none" src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png" />
            <span className="text-xl font-heading font-bold text-gradient whitespace-nowrap">GapRomance</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" fill="currentColor" /> Your Matches
        </h1>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading matches...</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">Keep swiping to find your perfect match!</p>
            <Button variant="hero" asChild><Link to="/discover">Go Discover</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {matches.map((m, i) => (
              <motion.button
                key={m.matchId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate("/messages", { state: { openMatchId: m.matchId } })}
                className="relative rounded-xl overflow-hidden aspect-[3/4] group"
              >
                <div className="absolute inset-0 bg-secondary">
                  {m.partnerPhoto ? (
                    <img src={m.partnerPhoto} alt={m.partnerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-heading text-muted-foreground">
                      {m.partnerName[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>

                {/* New badge */}
                {!m.hasBeenMessaged && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold z-10">
                    NEW
                  </div>
                )}

                {m.partnerVerified && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                    <Shield className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <h3 className="font-heading font-bold text-sm">
                    {m.partnerName}{m.partnerAge ? `, ${m.partnerAge}` : ""}
                  </h3>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
