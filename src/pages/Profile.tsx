import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Music, Edit3, Camera, MessageSquare, Clock, Eye, Save, X, Heart, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LIFESTYLE_ICONS, PERSONALITY_ICONS } from "@/lib/profile-constants";
import TopNav from "@/components/TopNav";
import ProfilePreviewCard from "@/components/ProfilePreviewCard";
import PhotoManager from "@/components/PhotoManager";

const NOTE_PLACEHOLDERS = [
  "Just got back from hiking...",
  "Free tonight, let's grab drinks",
  "In a great mood, come say hi",
  "Working from a coffee shop today",
];

const HOBBY_CATEGORIES: { category: string; emoji: string; options: string[] }[] = [
  { category: "Fitness & Sports", emoji: "🏃", options: ["Hiking","Running","Cycling","Swimming","Yoga","Pilates","Gym & Fitness","Martial Arts","Rock Climbing","Dancing","Golf","Tennis","Basketball","Soccer","Volleyball","Bowling","Kayaking","Surfing"] },
  { category: "Food & Drink", emoji: "🍳", options: ["Cooking","Baking","Wine Tasting","Cocktail Making","Coffee Culture","Foodie"] },
  { category: "Travel & Adventure", emoji: "✈️", options: ["Traveling","Road Trips","Backpacking","Camping","Fishing","Hunting"] },
  { category: "Arts & Creativity", emoji: "🎨", options: ["Photography","Painting","Drawing","Pottery","Gardening","Interior Design","Fashion & Style","Thrifting"] },
  { category: "Mind & Learning", emoji: "📚", options: ["Reading","Writing","Chess","Board Games","Trivia","History","Science","Volunteering"] },
  { category: "Tech & Gaming", emoji: "💻", options: ["Video Games","Technology","Comics","Cosplay"] },
  { category: "Music & Entertainment", emoji: "🎵", options: ["Singing","Playing an Instrument","Concerts & Live Music","Movies","Anime","Podcasts","Theater"] },
  { category: "Pets", emoji: "🐾", options: ["Dogs","Cats","Birds","Reptiles","Multiple Pets"] },
  { category: "Business & Finance", emoji: "💰", options: ["Entrepreneurship","Real Estate","Investing & Finance"] },
];

const LIFESTYLE_OPTIONS = ["Night Owl","Early Bird","Laid Back","Free Spirit","Adventurer","Career Driven","Hopeless Romantic","Family Oriented","Social Butterfly","Introvert","Extrovert","Ambivert","Spiritual","Minimalist","Health Conscious","Gym Rat","Creative Soul","Bookworm","Gamer","Traveler","Beach Lover","City Dweller","Country Living"];
const MUSIC_GENRES = ["Pop","R&B","Hip-Hop","Rock","Jazz","Electronic","Country","Latin","Classical","Indie","Reggaeton","Soul"];
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

const ProfileBadge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "primary" | "gold" }) => {
  const styles = { default: "bg-secondary text-secondary-foreground", primary: "bg-primary/15 text-primary border border-primary/30", gold: "bg-gold/15 text-gold border border-gold/30" };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-bold ${styles[variant]}`}>{children}</span>;
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

const isNoteActive = (updatedAt: string | null) => {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < 24 * 60 * 60 * 1000;
};

const getAge = (dob: string | null) => {
  if (!dob) return null;
  const b = new Date(dob);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

// ── EDIT PANEL WRAPPER ────────────────────────────────────────────────────────
const EditPanel = ({ title, onSave, onCancel, saving, children }: {
  title: string; onSave: () => void; onCancel: () => void; saving: boolean; children: React.ReactNode;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className="glass rounded-xl p-5 mb-4 glow-border">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-heading font-bold text-sm text-primary">{title}</h4>
      <div className="flex gap-2">
        <Button variant="hero" size="sm" onClick={onSave} disabled={saving}>
          <Save className="w-3 h-3 mr-1" />{saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-3 h-3" /></Button>
      </div>
    </div>
    {children}
  </motion.div>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [showPreview, setShowPreview] = useState(false);

  // Edit states
  const [editingBio, setEditingBio]         = useState(false);
  const [editingHobbies, setEditingHobbies] = useState(false);
  const [editingLifestyle, setEditingLifestyle] = useState(false);
  const [editingMusic, setEditingMusic]     = useState(false);
  const [editingPhotos, setEditingPhotos]   = useState(false);
  const [editingPrompts, setEditingPrompts] = useState(false);
  const [editingNote, setEditingNote]       = useState(false);
  const [editingOnline, setEditingOnline]   = useState(false);

  // Field values
  const [bioVal, setBioVal]                 = useState("");
  const [datingModeVal, setDatingModeVal]   = useState("Both");
  const [hobbiesVal, setHobbiesVal]         = useState<string[]>([]);
  const [lifestyleVal, setLifestyleVal]     = useState<string[]>([]);
  const [musicArtists, setMusicArtists]     = useState(["","",""]);
  const [musicGenres, setMusicGenres]       = useState<string[]>([]);
  const [musicSong, setMusicSong]           = useState("");
  const [photosVal, setPhotosVal]           = useState<string[]>([]);
  const [promptsSelected, setPromptsSelected] = useState<string[]>([]);
  const [promptAnswers, setPromptAnswers]   = useState<Record<string, string>>({});
  const [noteText, setNoteText]             = useState("");
  const [isOnline, setIsOnline]             = useState(false);

  const [saving, setSaving] = useState(false);

  // Populate from profile
  useEffect(() => {
    if (!profile) return;
    setBioVal(profile.bio || "");
    setDatingModeVal(profile.dating_mode || "Both");
    setHobbiesVal(profile.hobbies || []);
    setLifestyleVal(profile.lifestyle_badges || []);
    const artists = profile.favorite_artists || [];
    setMusicArtists([artists[0]||"", artists[1]||"", artists[2]||""]);
    setMusicGenres(profile.favorite_genres || []);
    setMusicSong(profile.favorite_song || "");
    setPhotosVal(profile.photos || []);
    const pa = profile.prompt_answers || {};
    const keys = Object.keys(pa);
    setPromptsSelected(keys);
    setPromptAnswers(pa);
    setIsOnline(profile.is_online || false);
    if ((profile as any).todays_note && isNoteActive((profile as any).todays_note_updated_at)) {
      setNoteText((profile as any).todays_note);
    }
  }, [profile]);

  const save = async (data: Record<string, any>) => {
    if (!user) return false;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update(data as any).eq("user_id", user.id);
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return false; }
      await refreshProfile();
      return true;
    } catch { toast({ title: "Failed to save", variant: "destructive" }); return false; }
    finally { setSaving(false); }
  };

  const handleSaveBio = async () => {
    const ok = await save({ bio: bioVal.trim() || null, dating_mode: datingModeVal });
    if (ok) { toast({ title: "Bio updated!" }); setEditingBio(false); }
  };

  const handleSaveHobbies = async () => {
    const ok = await save({ hobbies: hobbiesVal });
    if (ok) { toast({ title: "Hobbies updated!" }); setEditingHobbies(false); }
  };

  const handleSaveLifestyle = async () => {
    const ok = await save({ lifestyle_badges: lifestyleVal });
    if (ok) { toast({ title: "Lifestyle updated!" }); setEditingLifestyle(false); }
  };

  const handleSaveMusic = async () => {
    const ok = await save({
      favorite_artists: musicArtists.filter((a) => a.trim()),
      favorite_genres: musicGenres,
      favorite_song: musicSong.trim() || null,
    });
    if (ok) { toast({ title: "Music updated!" }); setEditingMusic(false); }
  };

  const handleSavePhotos = async () => {
    if (photosVal.length < 2) { toast({ title: "Please add at least 2 photos", variant: "destructive" }); return; }
    const ok = await save({ photos: photosVal, avatar_url: photosVal[0] || null });
    if (ok) { toast({ title: "Photos updated!" }); setEditingPhotos(false); }
  };

  const handleSavePrompts = async () => {
    const filtered: Record<string, string> = {};
    promptsSelected.forEach((p) => { if (promptAnswers[p]?.trim()) filtered[p] = promptAnswers[p].trim(); });
    const ok = await save({ prompt_answers: filtered });
    if (ok) { toast({ title: "Prompts updated!" }); setEditingPrompts(false); }
  };

  const handleSaveNote = async () => {
    const ok = await save({
      todays_note: noteText.trim() || null,
      todays_note_updated_at: noteText.trim() ? new Date().toISOString() : null,
    });
    if (ok) { toast({ title: noteText.trim() ? "Note updated!" : "Note cleared" }); setEditingNote(false); }
  };

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    await save({ is_online: next });
  };

  const toggleHobby = (h: string) => setHobbiesVal((p) => p.includes(h) ? p.filter((x) => x !== h) : [...p, h]);
  const toggleLifestyle = (l: string) => setLifestyleVal((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]);
  const toggleGenre = (g: string) => setMusicGenres((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);
  const togglePrompt = (p: string) => {
    if (promptsSelected.includes(p)) { setPromptsSelected((prev) => prev.filter((x) => x !== p)); }
    else if (promptsSelected.length < 3) { setPromptsSelected((prev) => [...prev, p]); }
  };

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

  const activeNote = (profile as any)?.todays_note && isNoteActive((profile as any)?.todays_note_updated_at) ? (profile as any).todays_note : null;
  const photos = profile?.photos || [];
  const hobbies = profile?.hobbies || [];
  const lifestyleBadges = profile?.lifestyle_badges || [];
  const favoriteArtists = profile?.favorite_artists || [];
  const favoriteGenres = profile?.favorite_genres || [];
  const favoriteSong = profile?.favorite_song || "";
  const promptAnswersStored = profile?.prompt_answers || {};
  const age = getAge(profile?.date_of_birth || null);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav rightContent={
        <>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-1" /> Preview My Profile
          </Button>
          <Button variant="ghost" size="sm" asChild><Link to="/settings">Settings</Link></Button>
        </>
      } />

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* ── PHOTOS ── */}
        <div className="mb-6">
          {!editingPhotos ? (
            <div className="relative">
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                  {photos.slice(0, 3).map((p, i) => (
                    <div key={i} className={`relative aspect-[4/5] ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-secondary flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No photos yet</p>
                </div>
              )}
              <button onClick={() => setEditingPhotos(true)}
                className="absolute bottom-3 right-3 p-2 glass rounded-full hover:bg-primary/20 transition-all">
                <Camera className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <EditPanel title="Edit Photos" onSave={handleSavePhotos} onCancel={() => setEditingPhotos(false)} saving={saving}>
                <p className="text-xs text-muted-foreground mb-3">Min 2, max 6 photos. First photo is your main photo.</p>
                {user && (
                  <PhotoManager
                    userId={user.id}
                    photos={photosVal}
                    onPhotosChange={setPhotosVal}
                    minPhotos={2}
                    maxPhotos={6}
                    showGuidelines={false}
                  />
                )}
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-heading font-bold">
                {profile?.first_name || "Your Name"}{profile?.last_initial ? ` ${profile.last_initial}.` : ""}{age ? `, ${age}` : ""}
              </h1>
              {profile?.is_verified && <ProfileBadge variant="gold"><Shield className="w-3 h-3 mr-1" />Verified</ProfileBadge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">@{profile?.username || "username"}</p>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3.5 h-3.5" />{profile?.city || "Location not set"}
            </div>
          </div>
          {/* Online indicator */}
          <button onClick={handleToggleOnline} className="flex items-center gap-2 glass px-3 py-2 rounded-full hover:bg-primary/10 transition-all">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
          </button>
        </div>

        {/* ── BIO & DATING MODE ── */}
        <div className="mb-6">
          {!editingBio ? (
            <div className="glass rounded-xl p-4 relative group">
              <div className="flex items-center justify-between mb-2">
                <ProfileBadge variant="primary">{datingModeVal === "Both" ? "Open to Both" : datingModeVal}</ProfileBadge>
                <button onClick={() => setEditingBio(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {profile?.bio || <span className="italic">No bio yet — tap the pencil to add one.</span>}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <EditPanel title="Edit Bio & Dating Mode" onSave={handleSaveBio} onCancel={() => setEditingBio(false)} saving={saving}>
                <textarea value={bioVal} onChange={(e) => setBioVal(e.target.value)} rows={4} maxLength={500}
                  placeholder="Tell people about yourself..."
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none mb-3" />
                <div className="flex flex-wrap gap-2">
                  {["Serious Dating","Casual Dating","Both"].map((m) => (
                    <button key={m} onClick={() => setDatingModeVal(m)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${datingModeVal === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                      {m === "Both" ? "Open to Both" : m}
                    </button>
                  ))}
                </div>
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

        {/* ── TODAY'S NOTE ── */}
        <div className="mb-6">
          {!editingNote ? (
            activeNote ? (
              <div className="glass rounded-xl p-4 glow-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs text-primary font-bold">
                    <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
                  </div>
                  <button onClick={() => { setNoteText(activeNote); setEditingNote(true); }}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Update
                  </button>
                </div>
                <p className="text-primary/90 italic">{activeNote}</p>
                {(profile as any)?.todays_note_updated_at && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Posted {getTimeAgo((profile as any).todays_note_updated_at)}
                  </p>
                )}
              </div>
            ) : (
              <button onClick={() => { setNoteText(""); setEditingNote(true); }}
                className="w-full glass rounded-xl p-4 border border-dashed border-border text-left hover:border-primary/40 transition-all">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mb-1">
                  <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
                </div>
                <p className="text-sm text-muted-foreground italic">Tap to add a note about what you're up to today...</p>
              </button>
            )
          ) : (
            <AnimatePresence>
              <EditPanel title="Today's Note" onSave={handleSaveNote} onCancel={() => setEditingNote(false)} saving={saving}>
                <div className="relative">
                  <textarea value={noteText} onChange={(e) => { if (e.target.value.length <= 150) setNoteText(e.target.value); }}
                    placeholder={NOTE_PLACEHOLDERS[0]} maxLength={150} rows={2} autoFocus
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none text-sm" />
                  <span className={`absolute bottom-2 right-3 text-xs ${noteText.length > 130 ? "text-destructive" : "text-muted-foreground"}`}>
                    {150 - noteText.length}
                  </span>
                </div>
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

        {/* ── HOBBIES ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold">Hobbies</h3>
            <button onClick={() => setEditingHobbies(!editingHobbies)} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> {editingHobbies ? "Done" : "Edit"}
            </button>
          </div>
          {!editingHobbies ? (
            hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => <span key={h} className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">{h}</span>)}
              </div>
            ) : (
              <button onClick={() => setEditingHobbies(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add hobbies
              </button>
            )
          ) : (
            <AnimatePresence>
              <EditPanel title="Edit Hobbies" onSave={handleSaveHobbies} onCancel={() => setEditingHobbies(false)} saving={saving}>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {HOBBY_CATEGORIES.map((cat) => (
                    <div key={cat.category}>
                      <p className="text-xs font-bold text-muted-foreground mb-2">{cat.emoji} {cat.category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.options.map((opt) => (
                          <button key={opt} onClick={() => toggleHobby(opt)}
                            className={`px-3 py-1 rounded-full text-xs border transition-all ${hobbiesVal.includes(opt) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

        {/* ── LIFESTYLE ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold">Lifestyle</h3>
            <button onClick={() => setEditingLifestyle(!editingLifestyle)} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> {editingLifestyle ? "Done" : "Edit"}
            </button>
          </div>
          {!editingLifestyle ? (
            lifestyleBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lifestyleBadges.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                    <span>{(LIFESTYLE_ICONS as any)[l]}</span> {l}
                  </span>
                ))}
              </div>
            ) : (
              <button onClick={() => setEditingLifestyle(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add lifestyle badges
              </button>
            )
          ) : (
            <AnimatePresence>
              <EditPanel title="Edit Lifestyle" onSave={handleSaveLifestyle} onCancel={() => setEditingLifestyle(false)} saving={saving}>
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_OPTIONS.map((l) => (
                    <button key={l} onClick={() => toggleLifestyle(l)}
                      className={`px-3 py-1 rounded-full text-xs border transition-all ${lifestyleVal.includes(l) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

        {/* ── LOVE LANGUAGE ── */}
        {profile?.love_language && (
          <div className="mb-6">
            <h3 className="font-heading text-lg font-semibold mb-2">Love Language</h3>
            <ProfileBadge variant="primary">❤️ {profile.love_language}</ProfileBadge>
          </div>
        )}

        {/* ── MUSIC ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" /> Music Taste
            </h3>
            <button onClick={() => setEditingMusic(!editingMusic)} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> {editingMusic ? "Done" : "Edit"}
            </button>
          </div>
          {!editingMusic ? (
            favoriteArtists.length > 0 || favoriteGenres.length > 0 || favoriteSong ? (
              <div className="space-y-3">
                {favoriteArtists.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Favorite Artists</p>
                    <div className="flex flex-wrap gap-2">{favoriteArtists.map((a) => <ProfileBadge key={a} variant="primary">{a}</ProfileBadge>)}</div>
                  </div>
                )}
                {favoriteGenres.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {favoriteGenres.map((g) => <span key={g} className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground"><Music className="w-3 h-3 inline mr-1" />{g}</span>)}
                    </div>
                  </div>
                )}
                {favoriteSong && <p className="text-foreground text-sm">🎵 {favoriteSong}</p>}
              </div>
            ) : (
              <button onClick={() => setEditingMusic(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add music taste
              </button>
            )
          ) : (
            <AnimatePresence>
              <EditPanel title="Edit Music" onSave={handleSaveMusic} onCancel={() => setEditingMusic(false)} saving={saving}>
                <div className="space-y-3">
                  {[0,1,2].map((i) => (
                    <input key={i} value={musicArtists[i]} onChange={(e) => { const u=[...musicArtists]; u[i]=e.target.value; setMusicArtists(u); }}
                      placeholder={`Artist ${i+1}`} className={inputClass} />
                  ))}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {MUSIC_GENRES.map((g) => (
                        <button key={g} onClick={() => toggleGenre(g)}
                          className={`px-3 py-1 rounded-full text-xs border transition-all ${musicGenres.includes(g) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input value={musicSong} onChange={(e) => setMusicSong(e.target.value)} placeholder="Favorite song — Artist" className={inputClass} />
                </div>
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

        {/* ── PROMPTS ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold">Prompts</h3>
            <button onClick={() => setEditingPrompts(!editingPrompts)} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> {editingPrompts ? "Done" : "Edit"}
            </button>
          </div>
          {!editingPrompts ? (
            Object.keys(promptAnswersStored).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(promptAnswersStored).map(([q, a]) => (
                  <div key={q} className="glass rounded-xl p-5">
                    <p className="text-primary text-sm font-bold mb-2">{q}</p>
                    <p className="text-foreground">{a}</p>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => setEditingPrompts(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add prompts
              </button>
            )
          ) : (
            <AnimatePresence>
              <EditPanel title="Edit Prompts" onSave={handleSavePrompts} onCancel={() => setEditingPrompts(false)} saving={saving}>
                <p className="text-xs text-muted-foreground mb-3">Pick up to 3 prompts and answer them.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {PROMPT_OPTIONS.map((p) => (
                    <button key={p} onClick={() => togglePrompt(p)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${promptsSelected.includes(p) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"} ${!promptsSelected.includes(p) && promptsSelected.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}>
                      {p}
                    </button>
                  ))}
                </div>
                {promptsSelected.map((p) => (
                  <div key={p} className="mb-3">
                    <label className="text-xs text-primary font-bold block mb-1">{p}</label>
                    <textarea value={promptAnswers[p] || ""} onChange={(e) => setPromptAnswers({ ...promptAnswers, [p]: e.target.value })}
                      placeholder="Your answer..." maxLength={200}
                      className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none h-16 focus:outline-none focus:border-primary text-sm" />
                  </div>
                ))}
              </EditPanel>
            </AnimatePresence>
          )}
        </div>

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
