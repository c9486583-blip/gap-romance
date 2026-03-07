import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Heart, Shield, MapPin, Music, Edit3, Camera, MessageSquare, Clock,
  Eye, EyeOff, X, Check, ChevronDown, ChevronUp, Circle, AtSign, Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LIFESTYLE_ICONS, PERSONALITY_ICONS } from "@/lib/profile-constants";
import TopNav from "@/components/TopNav";
import PhotoManager from "@/components/PhotoManager";
import ProfilePreviewCard from "@/components/ProfilePreviewCard";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const NOTE_PLACEHOLDERS = [
  "Just got back from hiking...",
  "Free tonight, let's grab drinks",
  "In a great mood, come say hi",
  "Working from a coffee shop today",
];

const HOBBIES_BY_CATEGORY = [
  { category: "Fitness & Sports", emoji: "🏃", options: ["Hiking", "Running", "Cycling", "Swimming", "Yoga", "Pilates", "Gym & Fitness", "Martial Arts", "Rock Climbing", "Skiing & Snowboarding", "Surfing", "Dancing", "Golf", "Tennis", "Basketball", "Football", "Soccer", "Baseball", "Volleyball", "Bowling", "Kayaking", "Skydiving", "Horseback Riding"] },
  { category: "Food & Drink", emoji: "🍳", options: ["Cooking", "Baking", "Meal Prepping", "Wine Tasting", "Cocktail Making", "Coffee Culture", "Foodie"] },
  { category: "Travel & Adventure", emoji: "✈️", options: ["Traveling", "Road Trips", "Backpacking", "Camping", "Fishing", "Hunting"] },
  { category: "Arts & Creativity", emoji: "🎨", options: ["Photography", "Videography", "Painting", "Drawing", "Sculpting", "Pottery", "Knitting & Crocheting", "Jewelry Making", "DIY & Home Projects", "Gardening", "Interior Design", "Fashion & Style", "Thrifting"] },
  { category: "Mind & Learning", emoji: "📚", options: ["Reading", "Writing", "Poetry", "Journaling", "Blogging", "Chess", "Board Games", "Trivia", "Puzzles", "History", "Science", "Politics", "Activism", "Volunteering"] },
  { category: "Tech & Gaming", emoji: "💻", options: ["Video Games", "Technology", "Comics", "Cosplay"] },
  { category: "Music & Entertainment", emoji: "🎵", options: ["Singing", "Playing an Instrument", "Music Production", "DJing", "Concerts & Live Music", "Nightlife", "Clubbing", "Festivals", "Movies", "Binge Watching", "Stand-Up Comedy", "Podcasts", "Theater & Performing Arts", "Anime"] },
  { category: "Wellness & Spirituality", emoji: "🙏", options: ["Meditation", "Spirituality", "Astrology", "Holistic Living", "Health & Wellness"] },
  { category: "Cars & Motorsports", emoji: "🚗", options: ["Cars & Motorsports", "Motorcycles"] },
  { category: "Pets", emoji: "🐾", options: ["Dogs", "Cats", "Birds", "Reptiles", "Fish & Aquariums", "Small Animals", "Multiple Pets"] },
  { category: "Business & Finance", emoji: "💰", options: ["Entrepreneurship", "Real Estate", "Investing & Finance"] },
];

const LIFESTYLE_BY_CATEGORY = [
  { category: "Daily Rhythm", emoji: "🌅", options: ["Night Owl", "Early Bird", "Laid Back", "Free Spirit", "Adventurer"] },
  { category: "Ambition & Drive", emoji: "💼", options: ["Career Driven", "Work Hard Play Hard", "Intellectual"] },
  { category: "Relationship & Social", emoji: "❤️", options: ["Hopeless Romantic", "Family Oriented", "Social Butterfly", "Introvert", "Extrovert", "Ambivert", "Old Soul", "Pet Parent", "Plant Parent"] },
  { category: "Wellness & Beliefs", emoji: "🙏", options: ["Spiritual", "Minimalist", "Maximalist", "Health Conscious", "Sober Lifestyle"] },
  { category: "Vibe & Personality", emoji: "🎉", options: ["Gym Rat", "Creative Soul", "Party Lover", "Thrill Seeker", "Fashionista", "Music Lover", "Bookworm", "Gamer", "Wine Lover", "Coffee Addict", "Tea Lover", "Traveler", "Beach Lover", "City Dweller", "Country Living"] },
];

const MUSIC_GENRES = ["Pop", "R&B", "Hip-Hop", "Rock", "Jazz", "Electronic", "Country", "Latin", "Classical", "Indie", "Reggaeton", "Soul"];

const PROMPT_OPTIONS = [
  "A perfect Sunday looks like...",
  "My biggest green flag is...",
  "I'm looking for someone who...",
  "The way to my heart is...",
  "I geek out about...",
  "My most controversial opinion is...",
  "Two truths and a lie...",
  "The key to my heart is...",
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const getAge = (dob: string | null | undefined): number | null => {
  if (!dob) return null;
  const b = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
};

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return "Expired";
};

const isNoteActive = (updatedAt: string | null | undefined) => {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < 24 * 60 * 60 * 1000;
};

// ─── SECTION EDIT WRAPPER ───────────────────────────────────────────────────
const EditSection = ({ title, children, onSave, onCancel, saving }: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) => (
  <div className="glass rounded-xl p-5 border border-primary/30 mb-6">
    <h4 className="font-heading font-bold mb-4 text-primary">{title}</h4>
    {children}
    <div className="flex gap-2 mt-4">
      <Button variant="hero" size="sm" onClick={onSave} disabled={saving}>
        {saving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</> : <><Check className="w-3 h-3 mr-1" /> Save</>}
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [showPreview, setShowPreview] = useState(false);

  // Online status
  const [isOnline, setIsOnline] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Edit mode states
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Editable fields
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [loveLanguage, setLoveLanguage] = useState("");
  const [favoriteArtists, setFavoriteArtists] = useState(["", "", ""]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteSong, setFavoriteSong] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [datingMode, setDatingMode] = useState("Both");

  // Today's Note
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Saving per section
  const [savingSection, setSavingSection] = useState(false);

  // Load profile into local state
  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio || "");
    setHobbies((profile.hobbies as string[] | null) || []);
    setLifestyle((profile.lifestyle_badges as string[] | null) || []);
    setLoveLanguage((profile.love_language as string | null) || "");
    const artists = (profile.favorite_artists as string[] | null) || [];
    setFavoriteArtists([...artists, "", "", ""].slice(0, 3));
    setFavoriteGenres((profile.favorite_genres as string[] | null) || []);
    setFavoriteSong((profile.favorite_song as string | null) || "");
    setPhotos((profile.photos as string[] | null) || []);
    setAvatarUrl(profile.avatar_url || null);
    setDatingMode((profile.dating_mode as string | null) || "Both");
    const pa = (profile as any).prompt_answers as Record<string, string> | null || {};
    setPromptAnswers(pa);
    setPrompts(Object.keys(pa));
    setIsOnline((profile as any).is_online ?? true);
    if (profile.todays_note && isNoteActive(profile.todays_note_updated_at)) {
      setNoteText(profile.todays_note);
    }
  }, [profile]);

  const save = async (fields: Record<string, any>) => {
    if (!user) return false;
    setSavingSection(true);
    try {
      const { error } = await supabase.from("profiles").update(fields as any).eq("user_id", user.id);
      if (error) {
        toast({ title: "Failed to save", description: error.message, variant: "destructive" });
        return false;
      }
      await refreshProfile();
      toast({ title: "Saved!" });
      return true;
    } catch (err: any) {
      toast({ title: err?.message || "Something went wrong", variant: "destructive" });
      return false;
    } finally {
      setSavingSection(false);
    }
  };

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    const newVal = !isOnline;
    setIsOnline(newVal);
    await save({ is_online: newVal });
    setTogglingOnline(false);
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    const ok = await save({
      todays_note: noteText.trim() || null,
      todays_note_updated_at: noteText.trim() ? new Date().toISOString() : null,
    });
    setSavingNote(false);
    if (ok) setEditingNote(false);
  };

  const handleSaveBio = async () => {
    const ok = await save({ bio: bio.trim() || null, dating_mode: datingMode });
    if (ok) setEditingSection(null);
  };

  const handleSaveHobbies = async () => {
    const ok = await save({ hobbies });
    if (ok) setEditingSection(null);
  };

  const handleSaveLifestyle = async () => {
    const ok = await save({ lifestyle_badges: lifestyle, love_language: loveLanguage || null });
    if (ok) setEditingSection(null);
  };

  const handleSaveMusic = async () => {
    const ok = await save({
      favorite_artists: favoriteArtists.map((a) => a.trim()).filter(Boolean),
      favorite_genres: favoriteGenres,
      favorite_song: favoriteSong.trim() || null,
    });
    if (ok) setEditingSection(null);
  };

  const handleSavePhotos = async () => {
    const ok = await save({
      photos,
      avatar_url: photos[0] || null,
    });
    if (ok) setEditingSection(null);
  };

  const handleSavePrompts = async () => {
    const filteredAnswers: Record<string, string> = {};
    prompts.forEach((p) => { if (promptAnswers[p]?.trim()) filteredAnswers[p] = promptAnswers[p].trim(); });
    const ok = await save({ prompt_answers: filteredAnswers });
    if (ok) setEditingSection(null);
  };

  const age = getAge(profile?.date_of_birth);
  const username = (profile as any)?.username;
  const activeNote = profile?.todays_note && isNoteActive(profile?.todays_note_updated_at) ? profile.todays_note : null;
  const hasMusicData = favoriteArtists.some((a) => a.trim()) || favoriteGenres.length > 0 || favoriteSong;
  const profilePhotos = (profile?.photos as string[] | null) || [];
  const displayPrompts = Object.entries((profile as any)?.prompt_answers || {}).filter(([, v]) => v);

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav rightContent={
        <>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button variant="ghost" size="sm" asChild><Link to="/settings">Settings</Link></Button>
        </>
      } />

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* ── PHOTOS SECTION ── */}
        {editingSection === "photos" ? (
          <EditSection title="Edit Photos" onSave={handleSavePhotos} onCancel={() => setEditingSection(null)} saving={savingSection}>
            <p className="text-xs text-muted-foreground mb-4">Min 2 photos, max 6. Drag to reorder — your first photo is your main profile photo.</p>
            {user && (
              <PhotoManager
                userId={user.id}
                photos={photos}
                onPhotosChange={setPhotos}
                minPhotos={2}
                maxPhotos={6}
                showGuidelines={false}
              />
            )}
          </EditSection>
        ) : (
          <div className="relative mb-6">
            <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
              {profilePhotos.length > 0
                ? profilePhotos.slice(0, 3).map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                      className={`relative aspect-[4/5] ${i === 0 ? "col-span-2" : ""}`}>
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      {/* Avatar overlay on main photo */}
                      {i === 0 && avatarUrl && (
                        <div className="absolute bottom-3 left-3">
                          <div className="relative">
                            <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-background shadow-lg" />
                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${isOnline ? "bg-green-400" : "bg-red-400"}`} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                : (
                  <div className="col-span-3 aspect-[16/7] bg-secondary rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No photos yet</p>
                  </div>
                )}
            </div>
            <button onClick={() => setEditingSection("photos")}
              className="absolute top-3 right-3 p-2 glass rounded-full hover:bg-primary/20 transition-all">
              <Camera className="w-4 h-4 text-foreground" />
            </button>
          </div>
        )}

        {/* ── HEADER: Name, Username, Online Toggle ── */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-heading font-bold">
                {profile?.first_name || "Your Name"}{profile?.last_initial ? ` ${profile.last_initial}.` : ""}{age ? `, ${age}` : ""}
              </h1>
              {profile?.is_verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gold/15 text-gold border border-gold/30">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            {username && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                <AtSign className="w-3.5 h-3.5" />{username}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" /> {profile?.city || "Location not set"}
            </div>
          </div>

          {/* Online Toggle */}
          <button
            onClick={handleToggleOnline}
            disabled={togglingOnline}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-all"
          >
            <div className="relative">
              <Circle className={`w-6 h-6 ${isOnline ? "text-green-400 fill-green-400" : "text-red-400 fill-red-400"}`} />
            </div>
            <span className="text-xs text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
          </button>
        </div>

        {/* ── TODAY'S NOTE ── */}
        {editingNote ? (
          <div className="glass rounded-xl p-4 mb-6 glow-border">
            <div className="flex items-center gap-2 text-xs text-primary font-bold mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
            </div>
            <div className="relative">
              <textarea value={noteText} onChange={(e) => { if (e.target.value.length <= 150) setNoteText(e.target.value); }}
                placeholder={NOTE_PLACEHOLDERS[0]} maxLength={150} rows={2} autoFocus
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none text-sm" />
              <span className={`absolute bottom-2 right-3 text-xs ${noteText.length > 130 ? "text-destructive" : "text-muted-foreground"}`}>
                {150 - noteText.length}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="hero" size="sm" onClick={handleSaveNote} disabled={savingNote}>
                {savingNote ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingNote(false)}>Cancel</Button>
            </div>
          </div>
        ) : activeNote ? (
          <div className="glass rounded-xl p-4 mb-6 glow-border">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs text-primary font-bold">
                <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
              </div>
              <button onClick={() => { setNoteText(activeNote); setEditingNote(true); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Update
              </button>
            </div>
            <p className="text-primary/90 italic">{activeNote}</p>
            {profile?.todays_note_updated_at && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Posted {getTimeAgo(profile.todays_note_updated_at)}
              </p>
            )}
          </div>
        ) : (
          <div className="glass rounded-xl p-4 mb-6 border border-dashed border-border">
            <button onClick={() => { setNoteText(""); setEditingNote(true); }} className="w-full text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mb-1">
                <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
              </div>
              <p className="text-sm text-muted-foreground italic">Tap to add a note about what you're up to today...</p>
            </button>
          </div>
        )}

        {/* ── BIO & DATING MODE ── */}
        {editingSection === "bio" ? (
          <EditSection title="Edit Bio & Dating Mode" onSave={handleSaveBio} onCancel={() => setEditingSection(null)} saving={savingSection}>
            <div className="space-y-4">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4}
                placeholder="Tell people about yourself..."
                className="w-full bg-secondary border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Dating Mode</label>
                <div className="flex flex-wrap gap-2">
                  {["Serious Dating", "Casual Dating", "Both"].map((m) => (
                    <button key={m} onClick={() => setDatingMode(m)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${datingMode === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {m === "Both" ? "Open to Both" : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </EditSection>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-lg font-semibold">About</h3>
              <button onClick={() => setEditingSection("bio")} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">{profile?.bio || <span className="italic opacity-60">No bio yet — tap Edit to add one.</span>}</p>
            {datingMode && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                <Heart className="w-3 h-3" /> {datingMode === "Both" ? "Open to Both" : datingMode}
              </span>
            )}
          </div>
        )}

        {/* ── HOBBIES ── */}
        {editingSection === "hobbies" ? (
          <EditSection title="Edit Hobbies" onSave={handleSaveHobbies} onCancel={() => setEditingSection(null)} saving={savingSection}>
            <p className="text-xs text-muted-foreground mb-4">Selected: {hobbies.length}</p>
            <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
              {HOBBIES_BY_CATEGORY.map((cat) => (
                <div key={cat.category}>
                  <h4 className="text-xs font-bold text-muted-foreground mb-2">{cat.emoji} {cat.category}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.options.map((opt) => {
                      const sel = hobbies.includes(opt);
                      return (
                        <button key={opt} onClick={() => setHobbies(sel ? hobbies.filter((h) => h !== opt) : [...hobbies, opt])}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${sel ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </EditSection>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold">Hobbies</h3>
              <button onClick={() => setEditingSection("hobbies")} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            {hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <span key={h} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">{h}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hobbies added yet.</p>
            )}
          </div>
        )}

        {/* ── LIFESTYLE & LOVE LANGUAGE ── */}
        {editingSection === "lifestyle" ? (
          <EditSection title="Edit Lifestyle & Love Language" onSave={handleSaveLifestyle} onCancel={() => setEditingSection(null)} saving={savingSection}>
            <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
              {LIFESTYLE_BY_CATEGORY.map((cat) => (
                <div key={cat.category}>
                  <h4 className="text-xs font-bold text-muted-foreground mb-2">{cat.emoji} {cat.category}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.options.map((opt) => {
                      const sel = lifestyle.includes(opt);
                      return (
                        <button key={opt} onClick={() => setLifestyle(sel ? lifestyle.filter((l) => l !== opt) : [...lifestyle, opt])}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${sel ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground mb-2">❤️ Love Language</h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"].map((ll) => (
                    <button key={ll} onClick={() => setLoveLanguage(loveLanguage === ll ? "" : ll)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${loveLanguage === ll ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {ll}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </EditSection>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold">Lifestyle</h3>
              <button onClick={() => setEditingSection("lifestyle")} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            {lifestyle.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {lifestyle.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                    <span>{LIFESTYLE_ICONS[l]}</span> {l}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mb-2">No lifestyle badges added yet.</p>
            )}
            {loveLanguage && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                ❤️ {loveLanguage}
              </span>
            )}
          </div>
        )}

        {/* ── MUSIC TASTE ── */}
        {editingSection === "music" ? (
          <EditSection title="Edit Music Taste" onSave={handleSaveMusic} onCancel={() => setEditingSection(null)} saving={savingSection}>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Favorite Artists (up to 3)</label>
                {[0, 1, 2].map((i) => (
                  <input key={i} value={favoriteArtists[i]} onChange={(e) => {
                    const updated = [...favoriteArtists];
                    updated[i] = e.target.value;
                    setFavoriteArtists(updated);
                  }} placeholder={`Artist ${i + 1}`} className={`${inputClass} mb-2`} />
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Genres</label>
                <div className="flex flex-wrap gap-1.5">
                  {MUSIC_GENRES.map((g) => {
                    const sel = favoriteGenres.includes(g);
                    return (
                      <button key={g} onClick={() => setFavoriteGenres(sel ? favoriteGenres.filter((x) => x !== g) : [...favoriteGenres, g])}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${sel ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Favorite Song</label>
                <input value={favoriteSong} onChange={(e) => setFavoriteSong(e.target.value)} placeholder="Song title — Artist" className={inputClass} />
              </div>
            </div>
          </EditSection>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" /> Music Taste
              </h3>
              <button onClick={() => setEditingSection("music")} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            {hasMusicData ? (
              <div className="space-y-3">
                {favoriteArtists.some((a) => a.trim()) && (
                  <div className="flex flex-wrap gap-2">
                    {favoriteArtists.filter((a) => a.trim()).map((a) => (
                      <span key={a} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">{a}</span>
                    ))}
                  </div>
                )}
                {favoriteGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {favoriteGenres.map((g) => (
                      <span key={g} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">
                        <Music className="w-3 h-3" /> {g}
                      </span>
                    ))}
                  </div>
                )}
                {favoriteSong && <p className="text-sm text-foreground">🎵 {favoriteSong}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No music taste added yet.</p>
            )}
          </div>
        )}

        {/* ── PROMPTS ── */}
        {editingSection === "prompts" ? (
          <EditSection title="Edit Prompts" onSave={handleSavePrompts} onCancel={() => setEditingSection(null)} saving={savingSection}>
            <p className="text-xs text-muted-foreground mb-3">Pick up to 3 prompts and answer them.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PROMPT_OPTIONS.map((p) => {
                const sel = prompts.includes(p);
                const disabled = !sel && prompts.length >= 3;
                return (
                  <button key={p} disabled={disabled} onClick={() => {
                    if (sel) setPrompts(prompts.filter((x) => x !== p));
                    else if (!disabled) setPrompts([...prompts, p]);
                  }} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${sel ? "bg-primary/20 border-primary text-primary" : disabled ? "border-border text-muted-foreground opacity-40 cursor-not-allowed" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {p}
                  </button>
                );
              })}
            </div>
            {prompts.map((p) => (
              <div key={p} className="mb-3">
                <label className="text-xs text-primary block mb-1">{p}</label>
                <textarea value={promptAnswers[p] || ""} onChange={(e) => setPromptAnswers({ ...promptAnswers, [p]: e.target.value })}
                  placeholder="Your answer..." maxLength={200} rows={2}
                  className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary text-sm" />
              </div>
            ))}
          </EditSection>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold">Prompts</h3>
              <button onClick={() => setEditingSection("prompts")} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            {displayPrompts.length > 0 ? (
              <div className="space-y-3">
                {displayPrompts.map(([q, a]) => (
                  <div key={q} className="glass rounded-xl p-5">
                    <p className="text-primary text-sm font-bold mb-2">{q}</p>
                    <p className="text-foreground">{a as string}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No prompts answered yet.</p>
            )}
          </div>
        )}

      </div>

      <AnimatePresence>
        {showPreview && profile && (
          <ProfilePreviewCard profile={profile} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
