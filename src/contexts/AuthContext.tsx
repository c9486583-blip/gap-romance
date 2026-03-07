import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { getTierFromProductId } from "@/lib/stripe-products";

export interface Profile {
  user_id: string;
  first_name: string | null;
  last_initial: string | null;
  username: string | null;
  email: string | null;
  gender: "Man" | "Woman" | null;
  date_of_birth: string | null;
  bio: string | null;
  occupation: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  location_preference: string | null;
  photos: string[];
  avatar_url: string | null;
  hobbies: string[];
  lifestyle_badges: string[];
  personality_badges: string[];
  favorite_genres: string[];
  favorite_artists: string[];
  favorite_song: string | null;
  love_language: string | null;
  dating_mode: "Serious Dating" | "Casual Dating" | "Both" | null;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  dealbreakers: string[];
  prompt_answers: Record<string, string> | null;
  music_taste: string | null;
  chronotype: string | null;
  is_online: boolean;
  show_online_status: boolean;
  read_receipts: boolean;
  is_verified: boolean;
  verification_status: "unverified" | "pending" | "verified" | null;
  onboarding_step: number;
  today_note: string | null;
  todays_note: string | null;
  todays_note_updated_at: string | null;
  last_active_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  subscriptionTier: "free" | "premium" | "elite";
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocation: (lat: number, lng: number, city: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const fallbackProfile = (userId: string): Profile => ({
  user_id: userId,
  first_name: null,
  last_initial: null,
  username: null,
  email: null,
  gender: null,
  date_of_birth: null,
  bio: null,
  occupation: null,
  city: null,
  state: null,
  latitude: null,
  longitude: null,
  location_preference: null,
  photos: [],
  avatar_url: null,
  hobbies: [],
  lifestyle_badges: [],
  personality_badges: [],
  favorite_genres: [],
  favorite_artists: [],
  favorite_song: null,
  love_language: null,
  dating_mode: null,
  preferred_age_min: null,
  preferred_age_max: null,
  dealbreakers: [],
  prompt_answers: null,
  music_taste: null,
  chronotype: null,
  is_online: false,
  show_online_status: true,
  read_receipts: true,
  is_verified: false,
  verification_status: null,
  onboarding_step: 0,
  today_note: null,
  todays_note: null,
  todays_note_updated_at: null,
  last_active_at: null,
  created_at: null,
  updated_at: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "premium" | "elite">("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchProfile = async (userId: string, currentUser?: User | null): Promise<Profile> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        const theUser = currentUser || user;
        if (data.onboarding_step === 0 && theUser?.email_confirmed_at) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({ onboarding_step: 1 })
            .eq("user_id", userId);
          if (!updateErr) data.onboarding_step = 1;
        }
        const typed = data as Profile;
        setProfile(typed);
        return typed;
      }

      if (error && error.code === "PGRST116") {
        try {
          const { data: sessionData } = await supabase.auth.getUser();
          const email = sessionData?.user?.email ?? null;
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({ user_id: userId, email })
            .select()
            .single();
          if (newProfile) {
            const typed = newProfile as Profile;
            setProfile(typed);
            return typed;
          }
        } catch (insertErr) {
          console.error("Failed to create profile:", insertErr);
        }
      }

      const fb = fallbackProfile(userId);
      setProfile(fb);
      return fb;
    } catch (err) {
      console.error("fetchProfile error:", err);
      const fb = fallbackProfile(userId);
      setProfile(fb);
      return fb;
    }
  };

  const refreshSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        const tier = getTierFromProductId(data.product_id);
        setSubscriptionTier(tier);
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
    }
  };

  const updateLocation = async (lat: number, lng: number, city: string) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ latitude: lat, longitude: lng, city })
      .eq("user_id", user.id);
    if (profile) setProfile({ ...profile, latitude: lat, longitude: lng, city });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setSubscriptionTier("free");
    setSubscriptionEnd(null);
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — if auth hangs for 3s, force loading to false
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user);
        setTimeout(() => refreshSubscription(), 500);
      } else {
        setProfile(null);
        setSubscriptionTier("free");
      }
      if (isMounted) {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        await fetchProfile(existingSession.user.id, existingSession.user);
        setTimeout(() => refreshSubscription(), 500);
      }
      if (isMounted) {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      subscriptionTier, subscriptionEnd,
      signOut, refreshSubscription, updateLocation,
      refreshProfile: async () => { if (user) await fetchProfile(user.id, user); },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
