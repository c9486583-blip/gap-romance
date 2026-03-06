import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell, Shield, LogOut, ChevronRight, CheckCircle, Music, X, MessageSquare, Sparkles, Heart, BellOff, Clock, Camera } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRODUCTS } from "@/lib/stripe-products";
import { Progress } from "@/components/ui/progress";
import {
  HOBBY_OPTIONS, LIFESTYLE_OPTIONS, PERSONALITY_OPTIONS, LOVE_LANGUAGES,
  GENRE_OPTIONS, LIFESTYLE_ICONS, PERSONALITY_ICONS,
} from "@/lib/profile-constants";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import PhotoManager from "@/components/PhotoManager";
import TopNav from "@/components/TopNav";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

const NOTE_PLACEHOLDERS = [
  "Just got back from hiking...",
  "Free tonight, let's grab drinks",
  "In a great mood, come say hi",
  "Working from a coffee shop today",
];

const REQUEST_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Please try again.")), timeoutMs)
    ),
  ]);
};
  const [activeTab, setActiveTab] = useState("account");
  const { user, profile, subscriptionTier, subscriptionEnd, signOut, refreshSubscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Account fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [datingMode, setDatingMode] = useState("Both");
  const [savingAccount, setSavingAccount] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || !data?.url) {
        toast({ title: "Could not open portal", variant: "destructive" });
        return;
      }
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Portal error:", err);
      toast({ title: "Could not open portal", variant: "destructive" });
    }
  };

  const handleVerify = async () => {
    toast({ title: "Verification", description: "ID verification coming soon! This feature will use Stripe Identity." });
  };

  // Music state
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>(["", "", ""]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteSong, setFavoriteSong] = useState("");
  const [savingMusic, setSavingMusic] = useState(false);

  // Today's Note state
  const [todaysNote, setTodaysNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const notePlaceholder = NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)];

  // Profile badges state
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lifestyleBadges, setLifestyleBadges] = useState<string[]>([]);
  const [personalityBadges, setPersonalityBadges] = useState<string[]>([]);
  const [loveLanguage, setLoveLanguage] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Photos state
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [savingPhotos, setSavingPhotos] = useState(false);

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
      if (profile.todays_note && profile.todays_note_updated_at) {
        const updatedAt = new Date(profile.todays_note_updated_at).getTime();
        if (Date.now() - updatedAt < 24 * 60 * 60 * 1000) {
          setTodaysNote(profile.todays_note);
        }
      }
      if (profile.hobbies) setHobbies(profile.hobbies as string[]);
      if (profile.lifestyle_badges) setLifestyleBadges(profile.lifestyle_badges as string[]);
      if (profile.personality_badges) setPersonalityBadges(profile.personality_badges as string[]);
      if (profile.love_language) setLoveLanguage(profile.love_language as string);
      if (profile.photos) setUserPhotos(profile.photos as string[]);
      // Account fields
      setDisplayName(profile.first_name ? `${profile.first_name} ${profile.last_initial || ""}`.trim() : "");
      setBio(profile.bio || "");
      setDatingMode(profile.dating_mode || "Both");
    }
  }, [profile]);

  const handleSaveNote = async () => {
    if (!user) return;
    setSavingNote(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        todays_note: todaysNote.trim() || null,
        todays_note_updated_at: todaysNote.trim() ? new Date().toISOString() : null,
      } as any)
      .eq("user_id", user.id);
    setSavingNote(false);
    if (!error) {
      toast({ title: todaysNote.trim() ? "Today's Note updated!" : "Today's Note cleared" });
      refreshProfile();
    } else {
      toast({ title: "Failed to save note", variant: "destructive" });
    }
  };

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
    if (!error) refreshProfile();
  };

  const toggleHobby = (h: string) => {
    setHobbies((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : prev.length < 10 ? [...prev, h] : prev
    );
  };

  const toggleLifestyle = (l: string) => {
    setLifestyleBadges((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : prev.length < 4 ? [...prev, l] : prev
    );
  };

  const togglePersonality = (p: string) => {
    setPersonalityBadges((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < 2 ? [...prev, p] : prev
    );
  };

  const handleSaveProfileBadges = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        hobbies,
        lifestyle_badges: lifestyleBadges,
        personality_badges: personalityBadges,
        love_language: loveLanguage || null,
      } as any)
      .eq("user_id", user.id);
    setSavingProfile(false);
    toast({
      title: error ? "Failed to save" : "Profile updated!",
      variant: error ? "destructive" : "default",
    });
    if (!error) refreshProfile();
  };

  const handleSavePhotos = async () => {
    if (!user) return;
    setSavingPhotos(true);
    const { error } = await supabase
      .from("profiles")
      .update({ photos: userPhotos, avatar_url: userPhotos[0] || null } as any)
      .eq("user_id", user.id);
    setSavingPhotos(false);
    toast({ title: error ? "Failed to save" : "Photos saved!", variant: error ? "destructive" : "default" });
    if (!error) refreshProfile();
  };

  const completeness = calculateProfileCompleteness(profile);

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "profile", label: "Profile & Badges", icon: Sparkles },
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
    <div className="min-h-screen bg-background pb-20">
      <TopNav rightContent={
        <>
          <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/profile">Profile</Link></Button>
        </>
      } />

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

                {/* Profile Completeness */}
                <div className="glass rounded-xl p-4 glow-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">Profile Completeness</span>
                    <span className={`text-sm font-bold ${completeness.percentage >= 70 ? "text-green-400" : "text-primary"}`}>
                      {completeness.percentage}%
                    </span>
                  </div>
                  <Progress value={completeness.percentage} className="h-2 mb-2" />
                  {completeness.percentage < 100 && (
                    <p className="text-xs text-muted-foreground">
                      {completeness.percentage < 70
                        ? "⚠️ Your profile needs to be 70% complete to appear in discovery."
                        : "🔥 Complete your profile to get 3x more matches!"}
                    </p>
                  )}
                  {completeness.missing.length > 0 && completeness.percentage < 100 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Missing: {completeness.missing.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Display Name</label>
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Email</label>
                    <input defaultValue={user.email || ""} disabled className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground opacity-60" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500}
                      placeholder="Tell people about yourself..."
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Dating Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {["Serious Dating", "Casual Dating", "Both"].map((m) => (
                        <button key={m} type="button" onClick={() => setDatingMode(m)}
                          className={`px-4 py-2 rounded-full text-sm border transition-all ${datingMode === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {m === "Both" ? "Open to Both" : m}
                        </button>
                      ))}
                    </div>
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

                  {/* Today's Note */}
                  <div className="border-t border-border/30 pt-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Today's Note
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">Share what you're up to today — it appears on your profile and in discovery. Expires after 24 hours.</p>
                    <div className="relative">
                      <textarea
                        value={todaysNote}
                        onChange={(e) => { if (e.target.value.length <= 150) setTodaysNote(e.target.value); }}
                        placeholder={notePlaceholder}
                        maxLength={150}
                        rows={2}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                      />
                      <span className={`absolute bottom-2 right-3 text-xs ${todaysNote.length > 130 ? "text-destructive" : "text-muted-foreground"}`}>
                        {150 - todaysNote.length}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleSaveNote} disabled={savingNote}>
                      {savingNote ? "Saving..." : todaysNote.trim() ? "Update Note" : "Clear Note"}
                    </Button>
                  </div>

                  <Button variant="hero" disabled={savingAccount} onClick={async () => {
                    if (!user) return;
                    setSavingAccount(true);
                    const nameParts = displayName.trim().split(" ");
                    const firstName = nameParts[0] || null;
                    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : null;
                    const { error } = await supabase
                      .from("profiles")
                      .update({
                        first_name: firstName,
                        last_initial: lastInitial,
                        bio: bio.trim() || null,
                        dating_mode: datingMode,
                      } as any)
                      .eq("user_id", user.id);
                    setSavingAccount(false);
                    toast({ title: error ? "Failed to save" : "Account saved!", variant: error ? "destructive" : "default" });
                    if (!error) refreshProfile();
                  }}>
                    {savingAccount ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "photos" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" /> Your Photos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your profile photos. You need at least 2 and can have up to 6. Drag to reorder — your first photo is your main profile photo.
                </p>
                {user && (
                  <PhotoManager
                    userId={user.id}
                    photos={userPhotos}
                    onPhotosChange={setUserPhotos}
                    minPhotos={2}
                    maxPhotos={6}
                    showGuidelines={false}
                  />
                )}
                <Button variant="hero" onClick={handleSavePhotos} disabled={savingPhotos}>
                  {savingPhotos ? "Saving..." : "Save Photos"}
                </Button>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Profile & Badges
                </h2>

                {/* Hobbies */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Hobbies <span className="text-muted-foreground">({hobbies.length}/10)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">Select up to 10 hobbies that describe you.</p>
                  <div className="flex flex-wrap gap-2">
                    {HOBBY_OPTIONS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggleHobby(h)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          hobbies.includes(h)
                            ? "bg-secondary text-foreground border border-foreground/30"
                            : "bg-secondary/50 text-muted-foreground border border-border hover:border-foreground/30"
                        }`}
                      >
                        {h}
                        {hobbies.includes(h) && <X className="w-3 h-3 ml-1 inline" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lifestyle Badges */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Lifestyle Badges <span className="text-muted-foreground">({lifestyleBadges.length}/4)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">Select up to 4 lifestyle badges.</p>
                  <div className="flex flex-wrap gap-2">
                    {LIFESTYLE_OPTIONS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLifestyle(l)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          lifestyleBadges.includes(l)
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-secondary/50 text-muted-foreground border border-border hover:border-primary/30"
                        }`}
                      >
                        <span>{LIFESTYLE_ICONS[l]}</span> {l}
                        {lifestyleBadges.includes(l) && <X className="w-3 h-3 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality Badges */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Personality Badges <span className="text-muted-foreground">({personalityBadges.length}/2)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">Select up to 2 personality badges.</p>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALITY_OPTIONS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePersonality(p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          personalityBadges.includes(p)
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-secondary/50 text-muted-foreground border border-border hover:border-primary/30"
                        }`}
                      >
                        <span>{PERSONALITY_ICONS[p]}</span> {p}
                        {personalityBadges.includes(p) && <X className="w-3 h-3 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Love Language */}
                <div>
                  <label className="text-sm font-medium block mb-1 flex items-center gap-1">
                    <Heart className="w-4 h-4 text-primary" /> Love Language
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">What's your love language?</p>
                  <div className="flex flex-wrap gap-2">
                    {LOVE_LANGUAGES.map((ll) => (
                      <button
                        key={ll}
                        type="button"
                        onClick={() => setLoveLanguage(loveLanguage === ll ? "" : ll)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          loveLanguage === ll
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-secondary/50 text-muted-foreground border border-border hover:border-primary/30"
                        }`}
                      >
                        {ll}
                      </button>
                    ))}
                  </div>
                </div>

                <Button variant="hero" onClick={handleSaveProfileBadges} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </Button>
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
              <NotificationSettings user={user} />
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
                  <DeleteAccountDialog user={user} signOut={signOut} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// Notification Settings Component
const NOTIF_CATEGORIES = [
  { key: "new_matches", label: "New Matches", desc: "When you match with someone" },
  { key: "new_messages", label: "New Messages", desc: "When you receive a message" },
  { key: "virtual_gifts", label: "Virtual Gifts", desc: "When someone sends you a gift" },
  { key: "super_likes", label: "Super Likes", desc: "When someone Super Likes you" },
  { key: "profile_activity", label: "Profile Activity", desc: "Likes, views, and engagement" },
  { key: "subscription_reminders", label: "Subscription Reminders", desc: "Renewal and expiry alerts" },
  { key: "daily_reminders", label: "Daily Reminders", desc: "Message resets and Today's Note" },
];

const NotificationSettings = ({ user }: { user: any }) => {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [prefs, setPrefs] = useState<Record<string, any>>({
    new_matches: true, new_messages: true, virtual_gifts: true, super_likes: true,
    profile_activity: true, subscription_reminders: true, daily_reminders: true,
    dnd_enabled: false, dnd_start: "23:00", dnd_end: "08:00",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setPrefs(data);
    };
    load();
  }, [user]);

  const updatePref = (key: string, value: any) => {
    setPrefs((p: Record<string, any>) => ({ ...p, [key]: value }));
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        new_matches: prefs.new_matches,
        new_messages: prefs.new_messages,
        virtual_gifts: prefs.virtual_gifts,
        super_likes: prefs.super_likes,
        profile_activity: prefs.profile_activity,
        subscription_reminders: prefs.subscription_reminders,
        daily_reminders: prefs.daily_reminders,
        dnd_enabled: prefs.dnd_enabled,
        dnd_start: prefs.dnd_start,
        dnd_end: prefs.dnd_end,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
    setSaving(false);
    toast({ title: error ? "Failed to save" : "Notification preferences saved!", variant: error ? "destructive" : "default" });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" /> Notifications
      </h2>

      {/* Push notification status */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {!isSupported
                ? "Not supported in this browser"
                : isSubscribed
                ? "Enabled — you'll receive notifications"
                : "Disabled — enable to get notified of matches and messages"}
            </p>
          </div>
          {isSupported && (
            <Button variant={isSubscribed ? "outline" : "hero"} size="sm" onClick={isSubscribed ? unsubscribe : subscribe}>
              {isSubscribed ? "Disable" : "Enable"}
            </Button>
          )}
        </div>
      </div>

      {/* Category toggles */}
      <div>
        <p className="text-sm font-medium mb-3">Notification Categories</p>
        {NOTIF_CATEGORIES.map((cat) => (
          <label key={cat.key} className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
            <div>
              <span className="text-sm block">{cat.label}</span>
              <span className="text-xs text-muted-foreground">{cat.desc}</span>
            </div>
            <div onClick={() => updatePref(cat.key, !prefs[cat.key])}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${prefs[cat.key] ? "bg-primary" : "bg-border"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${prefs[cat.key] ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </label>
        ))}
        <div className="flex items-center justify-between py-3 border-b border-border/30">
          <div>
            <span className="text-sm block">Safety Alerts</span>
            <span className="text-xs text-muted-foreground">Report updates and safety notices — always on</span>
          </div>
          <div className="w-10 h-5 rounded-full bg-primary relative cursor-not-allowed opacity-60">
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white translate-x-5" />
          </div>
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Do Not Disturb</span>
          </div>
          <div onClick={() => updatePref("dnd_enabled", !prefs.dnd_enabled)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${prefs.dnd_enabled ? "bg-primary" : "bg-border"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${prefs.dnd_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </div>
        {prefs.dnd_enabled && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <input type="time" value={prefs.dnd_start || "23:00"} onChange={(e) => updatePref("dnd_start", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <Clock className="w-4 h-4 text-muted-foreground mt-4" />
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <input type="time" value={prefs.dnd_end || "08:00"} onChange={(e) => updatePref("dnd_end", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
        )}
      </div>

      <Button variant="hero" onClick={savePrefs} disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
};

export default Settings;
