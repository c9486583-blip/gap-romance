import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { getTierFromProductId } from "@/lib/stripe-products";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  subscriptionTier: "free" | "premium" | "elite";
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocation: (lat: number, lng: number, city: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "premium" | "elite">("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setProfile(data);
        return data;
      }
      if (error && error.code === "PGRST116") {
        // No profile found — create one
        try {
          const { data: sessionData } = await supabase.auth.getUser();
          const email = sessionData?.user?.email || null;
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({ user_id: userId, email })
            .select()
            .single();
          if (newProfile) {
            setProfile(newProfile);
            return newProfile;
          }
        } catch (insertErr) {
          console.error("Failed to create profile:", insertErr);
        }
      }
      // Set an empty profile object so pages don't hang
      const fallback = { user_id: userId, first_name: null, photos: [], hobbies: [], bio: null };
      setProfile(fallback);
      return fallback;
    } catch (err) {
      console.error("fetchProfile error:", err);
      const fallback = { user_id: userId, first_name: null, photos: [], hobbies: [], bio: null };
      setProfile(fallback);
      return fallback;
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
    if (profile) {
      setProfile({ ...profile, latitude: lat, longitude: lng, city });
    }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
        setTimeout(() => refreshSubscription(), 500);
      } else {
        setProfile(null);
        setSubscriptionTier("free");
      }
      if (isMounted) setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        await fetchProfile(existingSession.user.id);
        setTimeout(() => refreshSubscription(), 500);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh subscription every 60 seconds
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
      refreshProfile: async () => { if (user) await fetchProfile(user.id); },
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
