import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell, Shield, LogOut, ChevronRight, CheckCircle, MessageSquare, BellOff, Clock, AtSign, MapPin, Eye, EyeOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import TopNav from "@/components/TopNav";

const NOTE_PLACEHOLDERS = [
  "Just got back from hiking...",
  "Free tonight, let's grab drinks",
  "In a great mood, come say hi",
  "Working from a coffee shop today",
];

const REQUEST_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(promiseLike: PromiseLike<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  return await Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Please try again.")), timeoutMs)
    ),
  ]);
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const { user, profile, subscriptionTier, subscriptionEnd, signOut, refreshSubscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Account fields
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [locationPreference, setLocationPreference] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Today's Note
  const [todaysNote, setTodaysNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const notePlaceholder = NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)];

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Privacy toggles
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastInitial(profile.last_initial || "");
      setUsername((profile as any).username || "");
      setLocationPreference((profile as any).location_preference || "");
      if (profile.todays_note && profile.todays_note_updated_at) {
        const updatedAt = new Date(profile.todays_note_updated_at).getTime();
        if (Date.now() - updatedAt < 24 * 60 * 60 * 1000) {
          setTodaysNote(profile.todays_note);
        }
      }
    }
  }, [profile]);

  // Load privacy prefs
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("show_online_status, read_receipts")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setShowOnlineStatus((data as any).show_online_status ?? true);
        setReadReceipts((data as any).read_receipts ?? true);
      }
    };
    load();
  }, [user]);

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
      toast({ title: "Could not open portal", variant: "destructive" });
    }
  };

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/\s/g, "");
    setUsername(cleaned);
    setUsernameTaken(false);
    setUsernameError("");

    if (cleaned.length === 0) return;
    if (cleaned.length < 4) {
      setUsernameError("Username must be at least 4 characters.");
      return;
    }
    if (cleaned.length > 15) {
      setUsernameError("Username must be 15 characters or less.");
      return;
    }

    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    setUsernameChecking(true);
    usernameCheckRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", cleaned)
        .neq("user_id", user?.id || "")
        .maybeSingle();
      if (data) {
        setUsernameTaken(true);
        setUsernameError("This username is already taken.");
      } else {
        setUsernameTaken(false);
        setUsernameError("");
      }
      setUsernameChecking(false);
    }, 600);
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    if (username.length > 0 && username.length < 4) {
      toast({ title: "Username must be at least 4 characters", variant: "destructive" });
      return;
    }
    if (username.length > 15) {
      toast({ title: "Username must be 15 characters or less", variant: "destructive" });
      return;
    }
    if (usernameTaken) {
      toast({ title: "That username is already taken", variant: "destructive" });
      return;
    }
    setSavingAccount(true);
    try {
      const { error } = await withTimeout(
        supabase.from("profiles").update({
          first_name: firstName.trim() || null,
          last_initial: lastInitial.trim() || null,
          username: username.trim() || null,
          location_preference: locationPreference || null,
        } as any).eq("user_id", user.id)
      );
      if (error) {
        toast({ title: "Failed to save", variant: "destructive" });
        return;
      }
      toast({ title: "Account saved!" });
      await refreshProfile();
    } catch (err: any) {
      toast({ title: err?.message || "Failed to save", variant: "destructive" });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user) return;
    setSavingNote(true);
    try {
      const { error } = await withTimeout(
        supabase.from("profiles").update({
          todays_note: todaysNote.trim() || null,
          todays_note_updated_at: todaysNote.trim() ? new Date().toISOString() : null,
        } as any).eq("user_id", user.id)
      );
      if (error) {
        toast({ title: "Failed to save note", variant: "destructive" });
        return;
      }
      toast({ title: todaysNote.trim() ? "Today's Note updated!" : "Today's Note cleared" });
      await refreshProfile();
    } catch (err: any) {
      toast({ title: err?.message || "Failed to save note", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;
    setSavingPrivacy(true);
    try {
      const { error } = await withTimeout(
        supabase.from("profiles").update({
          show_online_status: showOnlineStatus,
          read_receipts: readReceipts,
        } as any).eq("user_id", user.id)
      );
      if (error) {
        toast({ title: "Failed to save privacy settings", variant: "destructive" });
        return;
      }
      toast({ title: "Privacy settings saved!" });
      await refreshProfile();
    } catch (err: any) {
      toast({ title: err?.message || "Failed to save", variant: "destructive" });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword.trim()) {
      toast({ title: "Please enter your password to confirm", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      // Re-authenticate to verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: deletePassword,
      });
      if (signInError) {
        toast({ title: "Incorrect password", description: "Please enter the correct password to delete your account.", variant: "destructive" });
        return;
      }
      // Delete profile then auth user
      await supabase.from("profiles").delete().eq("user_id", user.id);
      const { error: deleteError } = await supabase.functions.invoke("delete-user");
      if (deleteError) {
        toast({ title: "Failed to delete account", description: "Please contact GapRomanceSupport@proton.me", variant: "destructive" });
        return;
      }
      await signOut();
      navigate("/");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
    } catch (err: any) {
      toast({ title: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const completeness = calculateProfileCompleteness(profile);

  const tabs = [
    { id: "account", label: "Account", icon: User },
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
          {/* Sidebar */}
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

          {/* Main content */}
          <div className="flex-1 glass rounded-xl p-6">

            {/* ── ACCOUNT ── */}
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
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">First Name</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Last Initial</label>
                      <input value={lastInitial} onChange={(e) => setLastInitial(e.target.value)} maxLength={1}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="yourcreativeusername"
                        maxLength={15}
                        className={`w-full bg-secondary border rounded-lg pl-9 pr-10 py-3 text-foreground focus:outline-none focus:border-primary ${usernameError ? "border-destructive" : username.length >= 4 && !usernameTaken && !usernameChecking ? "border-green-500" : "border-border"}`}
                      />
                      {usernameChecking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                      {!usernameChecking && username.length >= 4 && !usernameTaken && !usernameError && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
                    {!usernameError && <p className="text-xs text-muted-foreground mt-1">4–15 characters. Shows as "Chris · @{username || "username"}"</p>}
                  </div>

                  {/* Email — readonly */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Email</label>
                    <input value={user.email || ""} disabled
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground opacity-60 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed. Contact <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a> for help.</p>
                  </div>

                  {/* Location — readonly */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Your Location
                    </label>
                    <input value={profile?.city ? `${profile.city}` : "Location not detected"} disabled
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground opacity-60 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Only your city and state are shown — never your full address. To update your location, contact <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a>.
                    </p>
                  </div>

                  {/* Location Preference */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Location Preference</label>
                    <p className="text-xs text-muted-foreground mb-2">Which US state would you like to find matches in?</p>
                    <select
                      value={locationPreference}
                      onChange={(e) => setLocationPreference(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Anywhere in the US</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Verification Status */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-sm text-muted-foreground">Verification Status:</span>
                    {profile?.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-400">
                        <CheckCircle className="w-4 h-4" /> Verified ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        Pending verification
                      </span>
                    )}
                  </div>

                  {/* Today's Note */}
                  <div className="border-t border-border/30 pt-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Today's Note
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">Share what you're up to today — appears on your profile. Expires after 24 hours.</p>
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

                  <Button variant="hero" disabled={savingAccount || usernameTaken || usernameChecking} onClick={handleSaveAccount}>
                    {savingAccount ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTION ── */}
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
                  <div className="flex gap-3 flex-wrap">
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

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <NotificationSettings user={user} />
            )}

            {/* ── PRIVACY & SAFETY ── */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Privacy & Safety</h2>
                <div className="space-y-4">

                  {/* Online Status Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <span className="text-sm block">Show online status</span>
                      <span className="text-xs text-muted-foreground">Let others see when you're active</span>
                    </div>
                    <div onClick={() => setShowOnlineStatus((v) => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${showOnlineStatus ? "bg-primary" : "bg-border"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showOnlineStatus ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>

                  {/* Read Receipts Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <span className="text-sm block">Read receipts</span>
                      <span className="text-xs text-muted-foreground">Show when you've read messages</span>
                    </div>
                    <div onClick={() => setReadReceipts((v) => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${readReceipts ? "bg-primary" : "bg-border"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${readReceipts ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>

                  <Button variant="hero" onClick={handleSavePrivacy} disabled={savingPrivacy}>
                    {savingPrivacy ? "Saving..." : "Save Privacy Settings"}
                  </Button>

                  {/* Block List */}
                  <div className="pt-2">
                    <Button variant="outline">Block List</Button>
                  </div>

                  {/* Delete Account */}
                  <div className="border-t border-border/30 pt-6">
                    <h3 className="text-sm font-bold text-destructive mb-1">Delete Account</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      This is permanent and cannot be undone. All your data, matches, and messages will be deleted forever.
                    </p>
                    {!showDeleteConfirm ? (
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteConfirm(true)}>
                        Delete My Account
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                        <p className="text-sm font-medium">Enter your password to confirm deletion:</p>
                        <div className="relative">
                          <input
                            type={showDeletePassword ? "text" : "password"}
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-destructive pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDeletePassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount || !deletePassword.trim()}
                          >
                            {deletingAccount ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Confirm Delete"}
                          </Button>
                          <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
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

// ── NOTIFICATION SETTINGS COMPONENT ────────────────────────────────────────
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
      try {
        const { data } = await withTimeout(
          supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle()
        );
        if (data) setPrefs(data);
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      }
    };
    load();
  }, [user]);

  const updatePref = (key: string, value: any) => {
    setPrefs((p: Record<string, any>) => ({ ...p, [key]: value }));
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await withTimeout(
        supabase.from("notification_preferences").upsert({
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
        } as any, { onConflict: "user_id" })
      );
      if (error) {
        toast({ title: "Failed to save", variant: "destructive" });
        return;
      }
      toast({ title: "Notification preferences saved!" });
    } catch (err: any) {
      toast({ title: err?.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" /> Notifications
      </h2>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {!isSupported ? "Not supported in this browser"
                : isSubscribed ? "Enabled — you'll receive notifications"
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
