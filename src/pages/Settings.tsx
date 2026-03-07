import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell, Shield, LogOut, ChevronRight, CheckCircle, BellOff, Clock, Eye, EyeOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import TopNav from "@/components/TopNav";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { MessageSquare } from "lucide-react";

const NOTE_PLACEHOLDERS = [
  "Just got back from hiking...",
  "Free tonight, let's grab drinks",
  "In a great mood, come say hi",
  "Working from a coffee shop today",
];

const US_STATES = [
  "Anywhere in US","Alabama","Alaska","Arizona","Arkansas","California","Colorado",
  "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana",
  "Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma",
  "Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee",
  "Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const NOTIF_CATEGORIES = [
  { key: "new_matches",            label: "New Matches",            desc: "When you match with someone" },
  { key: "new_messages",           label: "New Messages",           desc: "When you receive a message" },
  { key: "virtual_gifts",          label: "Virtual Gifts",          desc: "When someone sends you a gift" },
  { key: "super_likes",            label: "Super Likes",            desc: "When someone Super Likes you" },
  { key: "profile_activity",       label: "Profile Activity",       desc: "Likes, views, and engagement" },
  { key: "subscription_reminders", label: "Subscription Reminders", desc: "Renewal and expiry alerts" },
  { key: "daily_reminders",        label: "Daily Reminders",        desc: "Message resets and Today's Note" },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const { user, profile, subscriptionTier, subscriptionEnd, signOut, refreshSubscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Account fields ──────────────────────────────────────────────────────────
  const [firstName, setFirstName]         = useState("");
  const [lastInitial, setLastInitial]     = useState("");
  const [username, setUsername]           = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking]   = useState(false);
  const [bio, setBio]                     = useState("");
  const [datingMode, setDatingMode]       = useState("Both");
  const [locationPref, setLocationPref]   = useState("Anywhere in US");
  const [todaysNote, setTodaysNote]       = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingNote, setSavingNote]       = useState(false);
  const notePlaceholder = NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)];

  // ── Privacy fields ──────────────────────────────────────────────────────────
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts]         = useState(true);
  const [savingPrivacy, setSavingPrivacy]       = useState(false);
  const [deletePassword, setDeletePassword]     = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount]   = useState(false);

  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastInitial(profile.last_initial || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setDatingMode(profile.dating_mode || "Both");
      setLocationPref((profile as any).location_preference || "Anywhere in US");
      setShowOnlineStatus(profile.show_online_status ?? true);
      setReadReceipts(profile.read_receipts ?? true);
      if ((profile as any).todays_note && (profile as any).todays_note_updated_at) {
        const updatedAt = new Date((profile as any).todays_note_updated_at).getTime();
        if (Date.now() - updatedAt < 24 * 60 * 60 * 1000) {
          setTodaysNote((profile as any).todays_note);
        }
      }
    }
  }, [profile]);

  // Username uniqueness check
  useEffect(() => {
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    const originalUsername = profile?.username || "";
    if (!username || username.length < 4 || username === originalUsername) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }
    setUsernameChecking(true);
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("username", username.toLowerCase())
          .maybeSingle();
        setUsernameAvailable(!data);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 600);
  }, [username, profile?.username]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || !data?.url) { toast({ title: "Could not open portal", variant: "destructive" }); return; }
      window.location.href = data.url;
    } catch {
      toast({ title: "Could not open portal", variant: "destructive" });
    }
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    if (username && username !== profile?.username) {
      if (username.length < 4 || username.length > 15) {
        toast({ title: "Username must be 4–15 characters", variant: "destructive" });
        return;
      }
      if (usernameAvailable === false) {
        toast({ title: "That username is already taken", variant: "destructive" });
        return;
      }
    }
    setSavingAccount(true);
    try {
      const { error } = await supabase.from("profiles").update({
        first_name: firstName.trim() || null,
        last_initial: lastInitial.trim().slice(0, 1) || null,
        username: username.toLowerCase().trim() || null,
        bio: bio.trim() || null,
        dating_mode: datingMode,
        location_preference: locationPref,
      } as any).eq("user_id", user.id);
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
      toast({ title: "Account saved!" });
      await refreshProfile();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user) return;
    setSavingNote(true);
    try {
      const { error } = await supabase.from("profiles").update({
        todays_note: todaysNote.trim() || null,
        todays_note_updated_at: todaysNote.trim() ? new Date().toISOString() : null,
      } as any).eq("user_id", user.id);
      if (error) { toast({ title: "Failed to save note", variant: "destructive" }); return; }
      toast({ title: todaysNote.trim() ? "Today's Note updated!" : "Today's Note cleared" });
      await refreshProfile();
    } catch {
      toast({ title: "Failed to save note", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;
    setSavingPrivacy(true);
    try {
      const { error } = await supabase.from("profiles").update({
        show_online_status: showOnlineStatus,
        read_receipts: readReceipts,
      } as any).eq("user_id", user.id);
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
      toast({ title: "Privacy settings saved!" });
      await refreshProfile();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) {
      toast({ title: "Please enter your password", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: deletePassword,
      });
      if (authError) {
        toast({ title: "Incorrect password", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("profiles").delete().eq("user_id", user.id);
      if (error) { toast({ title: "Failed to delete account", variant: "destructive" }); return; }
      await supabase.auth.admin.deleteUser(user.id).catch(() => {});
      await signOut();
      navigate("/");
      toast({ title: "Account deleted" });
    } catch {
      toast({ title: "Failed to delete account", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const completeness = calculateProfileCompleteness(profile);

  const tabs = [
    { id: "account",       label: "Account",        icon: User },
    { id: "subscription",  label: "Subscription",   icon: CreditCard },
    { id: "notifications", label: "Notifications",  icon: Bell },
    { id: "privacy",       label: "Privacy & Safety", icon: Shield },
  ];

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary";

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

          {/* Content */}
          <div className="flex-1 glass rounded-xl p-6">

            {/* ── ACCOUNT TAB ── */}
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
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">First Name</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Last Initial</label>
                      <input value={lastInitial} onChange={(e) => setLastInitial(e.target.value.slice(0, 1))} maxLength={1} className={inputClass} />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-muted-foreground text-sm">@</span>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "").slice(0, 15))}
                        maxLength={15}
                        className={`${inputClass} pl-8 pr-10 ${usernameAvailable === true ? "border-green-500" : usernameAvailable === false ? "border-destructive" : ""}`}
                      />
                      <span className="absolute right-4">
                        {usernameChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {!usernameChecking && usernameAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {!usernameChecking && usernameAvailable === false && <span className="text-destructive text-xs">✕</span>}
                      </span>
                    </div>
                    {usernameAvailable === false && (
                      <p className="text-xs text-destructive mt-1">That username is already taken</p>
                    )}
                  </div>

                  {/* Email — readonly */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Email</label>
                    <input defaultValue={user.email || ""} disabled className={`${inputClass} opacity-60`} />
                    <p className="text-xs text-muted-foreground mt-1">To change your email, contact support.</p>
                  </div>

                  {/* Location — readonly */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Location</label>
                    <input defaultValue={profile?.city ? `${profile.city}` : "Not set"} disabled className={`${inputClass} opacity-60`} />
                    <p className="text-xs text-muted-foreground mt-1">Location is detected automatically. Contact support to update.</p>
                  </div>

                  {/* Location Preference */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Location Preference</label>
                    <select value={locationPref} onChange={(e) => setLocationPref(e.target.value)}
                      className={inputClass}>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Verification status */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Verification:</span>
                    {profile?.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-400 font-bold">
                        <CheckCircle className="w-4 h-4" /> Verified ✓
                      </span>
                    ) : (profile as any)?.verification_status === "pending" ? (
                      <span className="text-sm text-yellow-400 font-medium">Pending verification</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not verified</span>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500}
                      placeholder="Tell people about yourself..."
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none" />
                  </div>

                  {/* Dating Mode */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Dating Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {["Serious Dating", "Casual Dating", "Both"].map((m) => (
                        <button key={m} onClick={() => setDatingMode(m)}
                          className={`px-4 py-2 rounded-full text-sm border transition-all ${datingMode === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {m === "Both" ? "Open to Both" : m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Today's Note */}
                  <div className="border-t border-border/30 pt-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Today's Note
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">Share what you're up to today — expires after 24 hours.</p>
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

                  <Button variant="hero" disabled={savingAccount} onClick={handleSaveAccount}>
                    {savingAccount ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTION TAB ── */}
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
                    {subscriptionTier === "free" && <Button variant="hero" asChild><Link to="/pricing">Upgrade</Link></Button>}
                    {subscriptionTier === "premium" && <Button variant="hero" asChild><Link to="/pricing">Upgrade to Elite</Link></Button>}
                    {subscriptionTier !== "free" && <Button variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>}
                    <Button variant="ghost" onClick={refreshSubscription}>Refresh Status</Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && <NotificationSettings user={user} />}

            {/* ── PRIVACY TAB ── */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Privacy & Safety</h2>

                <div className="space-y-4">
                  <Toggle
                    label="Show online status"
                    desc="Let others see when you're active"
                    checked={showOnlineStatus}
                    onChange={setShowOnlineStatus}
                  />
                  <Toggle
                    label="Read receipts"
                    desc="Show when you've read messages"
                    checked={readReceipts}
                    onChange={setReadReceipts}
                  />
                </div>

                <Button variant="hero" onClick={handleSavePrivacy} disabled={savingPrivacy}>
                  {savingPrivacy ? "Saving..." : "Save Privacy Settings"}
                </Button>

                {/* Delete account */}
                <div className="border-t border-border/30 pt-6">
                  <h3 className="text-sm font-bold text-destructive mb-3">Delete Account</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    This permanently deletes your profile, matches, and messages. This cannot be undone.
                  </p>
                  <div className="relative mb-3">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password to confirm"
                      className={`${inputClass} pr-10`}
                    />
                    <button onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccount || !deletePassword}>
                    {deletingAccount ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Permanently Delete Account"}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// ── TOGGLE COMPONENT ──────────────────────────────────────────────────────────
const Toggle = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
    <div>
      <span className="text-sm block">{label}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </div>
    <div onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${checked ? "bg-primary" : "bg-border"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </div>
  </label>
);

// ── NOTIFICATION SETTINGS ─────────────────────────────────────────────────────
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
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setPrefs(data); });
  }, [user]);

  const updatePref = (key: string, value: any) => setPrefs((p) => ({ ...p, [key]: value }));

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
      toast({ title: "Notification preferences saved!" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
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
                : "Disabled — enable to get notified"}
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
          <Toggle key={cat.key} label={cat.label} desc={cat.desc}
            checked={prefs[cat.key] ?? true}
            onChange={(v) => updatePref(cat.key, v)} />
        ))}
        <div className="flex items-center justify-between py-3 border-b border-border/30">
          <div>
            <span className="text-sm block">Safety Alerts</span>
            <span className="text-xs text-muted-foreground">Always on</span>
          </div>
          <div className="w-10 h-5 rounded-full bg-primary relative opacity-60 cursor-not-allowed">
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
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <Clock className="w-4 h-4 text-muted-foreground mt-4" />
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <input type="time" value={prefs.dnd_end || "08:00"} onChange={(e) => updatePref("dnd_end", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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
