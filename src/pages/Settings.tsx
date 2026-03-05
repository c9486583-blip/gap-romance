import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell, Shield, LogOut, ChevronRight, CheckCircle, Music, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRODUCTS } from "@/lib/stripe-products";

const GENRE_OPTIONS = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Country", "Jazz", "Classical",
  "Electronic", "Reggae", "Latin", "Gospel", "Alternative", "Indie", "Metal", "Other",
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const { user, profile, subscriptionTier, subscriptionEnd, signOut, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error || !data?.url) {
      toast({ title: "Could not open portal", variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank");
  };

  const handleVerify = async () => {
    // Stripe Identity verification - free for users
    toast({ title: "Verification", description: "ID verification coming soon! This feature will use Stripe Identity." });
  };

  // Music state
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>(["", "", ""]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteSong, setFavoriteSong] = useState("");
  const [savingMusic, setSavingMusic] = useState(false);

  useEffect(() => {
    if (profile) {
      const artists = profile.favorite_artists as string[] | null;
      if (artists && artists.length > 0) {
        const padded = [...artists, "", "", ""].slice(0, 3);
        setFavoriteArtists(padded);
      }
      const genres = profile.favorite_genres as string[] | null;
      if (genres) setFavoriteGenres(genres);
      if (profile.favorite_song) setFavoriteSong(profile.favorite_song as string);
    }
  }, [profile]);

  const toggleGenre = (genre: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSaveMusic = async () => {
    if (!user) return;
    setSavingMusic(true);
    const cleanArtists = favoriteArtists.map((a) => a.trim()).filter(Boolean);
    const { error } = await supabase
      .from("profiles")
      .update({
        favorite_artists: cleanArtists,
        favorite_genres: favoriteGenres,
        favorite_song: favoriteSong.trim() || null,
      } as any)
      .eq("user_id", user.id);
    setSavingMusic(false);
    toast({
      title: error ? "Failed to save" : "Music saved!",
      variant: error ? "destructive" : "default",
    });
  };

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "music", label: "Music Taste", icon: Music },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Safety", icon: Shield },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to access settings</p>
          <Button variant="hero" asChild><Link to="/login">Log In</Link></Button>
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
            <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/profile">Profile</Link></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold mb-8">Settings</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-60 flex-shrink-0">
            <div className="space-y-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === t.id ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-secondary"}`}>
                  <t.icon className="w-4 h-4" /> {t.label} <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>

          <div className="flex-1 glass rounded-xl p-6">
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Account Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Display Name</label>
                    <input defaultValue={profile?.first_name ? `${profile.first_name} ${profile.last_initial || ""}` : ""} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Email</label>
                    <input defaultValue={user.email || ""} disabled className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground opacity-60" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Location</label>
                    <input defaultValue={profile?.city || "Not set"} disabled className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground opacity-60" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Verification Status:</span>
                    {profile?.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-sm text-gold font-bold"><CheckCircle className="w-4 h-4" /> Verified</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleVerify}>Verify Identity (Free)</Button>
                    )}
                  </div>
                  <Button variant="hero">Save Changes</Button>
                </div>
              </div>
            )}
            {activeTab === "music" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" /> Music Taste
                </h2>
                <p className="text-sm text-muted-foreground">Share your music taste on your profile for others to see.</p>

                <div className="space-y-3">
                  <label className="text-sm font-medium block">Favorite Artists (up to 3)</label>
                  {favoriteArtists.map((artist, i) => (
                    <input
                      key={i}
                      value={artist}
                      onChange={(e) => {
                        const updated = [...favoriteArtists];
                        updated[i] = e.target.value;
                        setFavoriteArtists(updated);
                      }}
                      maxLength={100}
                      placeholder={`Artist ${i + 1}`}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                    />
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-3">Favorite Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          favoriteGenres.includes(genre)
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                        }`}
                      >
                        {genre}
                        {favoriteGenres.includes(genre) && <X className="w-3 h-3 ml-1 inline" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Favorite Song</label>
                  <input
                    value={favoriteSong}
                    onChange={(e) => setFavoriteSong(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Clair de Lune — Debussy"
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <Button variant="hero" onClick={handleSaveMusic} disabled={savingMusic}>
                  {savingMusic ? "Saving..." : "Save Music"}
                </Button>
              </div>
            )}
            {activeTab === "subscription" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Your Plan</h2>
                <div className="glass rounded-xl p-6 glow-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold capitalize">{subscriptionTier}</h3>
                      {subscriptionEnd && (
                        <p className="text-sm text-muted-foreground">
                          Renews {new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                      {subscriptionTier === "free" && <p className="text-sm text-muted-foreground">Free plan — upgrade for more features</p>}
                    </div>
                    <span className="text-2xl font-heading font-bold text-gradient">
                      {subscriptionTier === "free" ? "$0" : subscriptionTier === "premium" ? "$19.99/mo" : "$34.99/mo"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {subscriptionTier === "free" && (
                      <Button variant="hero" asChild><Link to="/pricing">Upgrade</Link></Button>
                    )}
                    {subscriptionTier === "premium" && (
                      <Button variant="hero" asChild><Link to="/pricing">Upgrade to Elite</Link></Button>
                    )}
                    {subscriptionTier !== "free" && (
                      <Button variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>
                    )}
                    <Button variant="ghost" onClick={refreshSubscription}>Refresh Status</Button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Notifications</h2>
                {["New matches", "Messages", "Likes", "Profile views", "Promotions"].map((n) => (
                  <label key={n} className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
                    <span className="text-sm">{n}</span>
                    <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  </label>
                ))}
              </div>
            )}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Privacy & Safety</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
                    <div>
                      <span className="text-sm block">Show online status</span>
                      <span className="text-xs text-muted-foreground">Let others see when you're active</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
                    <div>
                      <span className="text-sm block">Read receipts</span>
                      <span className="text-xs text-muted-foreground">Show when you've read messages</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  </label>
                  <div className="pt-4">
                    <Button variant="outline">Block List</Button>
                  </div>
                  <div className="pt-2">
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
