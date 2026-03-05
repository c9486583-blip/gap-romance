import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Shield, MapPin, Music, Edit3, Camera, Star, MoreVertical, Flag, Ban, MessageSquare, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportModal from "@/components/ReportModal";
import BlockConfirmDialog from "@/components/BlockConfirmDialog";

const NOTE_PLACEHOLDERS = [
  "Just got back from hiking...",
  "Free tonight, let's grab drinks",
  "In a great mood, come say hi",
  "Working from a coffee shop today",
];

const mockProfile = {
  name: "Sophia M.",
  age: 24,
  location: "Los Angeles, CA",
  verified: true,
  datingMode: "Serious Dating",
  bio: "Art school grad with a thing for older souls. I believe the best conversations happen over candlelight. Lover of gallery openings, spontaneous road trips, and anyone who can make me laugh until I cry.",
  hobbies: ["Travel", "Art", "Wine Tasting", "Photography", "Yoga", "Cooking"],
  music: ["Jazz", "R&B", "Indie", "Soul"],
  lifestyle: ["Foodie", "Adventurer", "Night Owl"],
  personality: ["Ambivert"],
  loveLanguage: "Quality Time",
  prompts: [
    { q: "A perfect Sunday looks like...", a: "Farmers market in the morning, painting in the afternoon, rooftop dinner at sunset." },
    { q: "The way to my heart is...", a: "Thoughtfulness. Remember the small things I say — that's it." },
    { q: "I geek out about...", a: "Renaissance art, natural wine, and 90s rom-coms." },
  ],
  photos: [
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
  ],
};

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "primary" | "gold" }) => {
  const styles = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/15 text-primary border border-primary/30",
    gold: "bg-gold/15 text-gold border border-gold/30",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
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

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const favoriteArtists = (profile?.favorite_artists as string[] | null) || [];
  const favoriteGenres = (profile?.favorite_genres as string[] | null) || [];
  const favoriteSong = (profile?.favorite_song as string | null) || "";
  const hasMusicData = favoriteArtists.length > 0 || favoriteGenres.length > 0 || favoriteSong;

  const activeNote = profile?.todays_note && isNoteActive(profile?.todays_note_updated_at) ? profile.todays_note : null;
  const noteUpdatedAt = profile?.todays_note_updated_at;

  // 3-day nudge check
  const showNudge = (() => {
    if (!profile) return false;
    if (activeNote) return false;
    const updatedAt = profile.todays_note_updated_at;
    if (!updatedAt) return true; // never posted
    const daysSince = (Date.now() - new Date(updatedAt).getTime()) / (24 * 60 * 60 * 1000);
    return daysSince > 3;
  })();

  const handleSaveNote = async () => {
    if (!user) return;
    setSavingNote(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        todays_note: noteText.trim() || null,
        todays_note_updated_at: noteText.trim() ? new Date().toISOString() : null,
      } as any)
      .eq("user_id", user.id);
    setSavingNote(false);
    if (!error) {
      toast({ title: noteText.trim() ? "Today's Note updated!" : "Note cleared" });
      setEditingNote(false);
      refreshProfile();
    }
  };

  const startEditNote = () => {
    setNoteText(activeNote || "");
    setEditingNote(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/messages">Messages</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/settings">Settings</Link></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 3-day nudge */}
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 mb-6 border border-primary/30 flex items-center gap-3"
          >
            <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">Let people know what you're up to today — <span className="text-primary font-bold">add a Today's Note</span> to your profile!</p>
            </div>
            <Button variant="hero" size="sm" onClick={startEditNote}>Add Note</Button>
          </motion.div>
        )}

        {/* Photos */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6">
          {mockProfile.photos.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`relative aspect-[4/5] ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <img src={p} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <button className="absolute bottom-3 right-3 p-2 glass rounded-full">
                  <Camera className="w-4 h-4 text-foreground" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-heading font-bold">{mockProfile.name}, {mockProfile.age}</h1>
              {mockProfile.verified && (
                <Badge variant="gold"><Shield className="w-3 h-3 mr-1" /> Verified</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" /> {mockProfile.location}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">{mockProfile.datingMode}</Badge>
            <Button variant="ghost" size="icon"><Edit3 className="w-4 h-4" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                  <Flag className="w-4 h-4 mr-2" /> Report User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockOpen(true)} className="text-destructive">
                  <Ban className="w-4 h-4 mr-2" /> Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Today's Note */}
        {editingNote ? (
          <div className="glass rounded-xl p-4 mb-6 glow-border">
            <div className="flex items-center gap-2 text-xs text-primary font-bold mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
            </div>
            <div className="relative">
              <textarea
                value={noteText}
                onChange={(e) => { if (e.target.value.length <= 150) setNoteText(e.target.value); }}
                placeholder={NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)]}
                maxLength={150}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none text-sm"
                autoFocus
              />
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
              <button onClick={startEditNote} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Update
              </button>
            </div>
            <p className="text-primary/90 italic">{activeNote}</p>
            {noteUpdatedAt && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Posted {getTimeAgo(noteUpdatedAt)}
              </p>
            )}
          </div>
        ) : (
          <div className="glass rounded-xl p-4 mb-6 border border-dashed border-border">
            <button onClick={startEditNote} className="w-full text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mb-1">
                <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
              </div>
              <p className="text-sm text-muted-foreground italic">Tap to add a note about what you're up to today...</p>
            </button>
          </div>
        )}

        {/* Bio */}
        <div className="mb-6">
          <h3 className="font-heading text-lg font-semibold mb-2">About</h3>
          <p className="text-muted-foreground leading-relaxed">{mockProfile.bio}</p>
        </div>

        {/* Hobbies */}
        <div className="mb-6">
          <h3 className="font-heading text-lg font-semibold mb-3">Hobbies</h3>
          <div className="flex flex-wrap gap-2">
            {mockProfile.hobbies.map((h) => <Badge key={h}>{h}</Badge>)}
          </div>
        </div>

        {/* Music Taste */}
        {hasMusicData ? (
          <div className="mb-6">
            <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" /> Music Taste
            </h3>
            {favoriteArtists.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Favorite Artists</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteArtists.map((a) => <Badge key={a} variant="primary">{a}</Badge>)}
                </div>
              </div>
            )}
            {favoriteGenres.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteGenres.map((g) => <Badge key={g}>{g}</Badge>)}
                </div>
              </div>
            )}
            {favoriteSong && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Favorite Song</p>
                <p className="text-foreground text-sm">🎵 {favoriteSong}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 glass rounded-xl p-4">
            <h3 className="font-heading text-lg font-semibold mb-2 flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" /> Music Taste
            </h3>
            <p className="text-sm text-muted-foreground mb-3">Share your music taste on your profile!</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">Add Music</Link>
            </Button>
          </div>
        )}

        {/* Lifestyle & Personality */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-heading text-lg font-semibold mb-3">Lifestyle</h3>
            <div className="flex flex-wrap gap-2">
              {mockProfile.lifestyle.map((l) => <Badge key={l}>{l}</Badge>)}
            </div>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-3">Personality</h3>
            <div className="flex flex-wrap gap-2">
              {mockProfile.personality.map((p) => <Badge key={p}>{p}</Badge>)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">❤️ {mockProfile.loveLanguage}</p>
          </div>
        </div>

        {/* Prompts */}
        <div className="space-y-4 mb-8">
          <h3 className="font-heading text-lg font-semibold">Prompts</h3>
          {mockProfile.prompts.map((p, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <p className="text-primary text-sm font-bold mb-2">{p.q}</p>
              <p className="text-foreground">{p.a}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pb-10">
          <Button variant="hero-outline" size="lg">
            <MessageCircle className="mr-2" /> Message
          </Button>
          <Button variant="hero" size="lg">
            <Heart className="mr-2" /> Like
          </Button>
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedUserId="mock-user-id"
        source="profile"
      />
      <BlockConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        blockedUserId="mock-user-id"
        blockedUserName={mockProfile.name}
      />
    </div>
  );
};

export default Profile;
