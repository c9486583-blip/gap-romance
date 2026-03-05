import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Shield, MapPin, Music, Edit3, Camera, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const mockProfile = {
  name: "Sophia M.",
  age: 24,
  location: "Los Angeles, CA",
  verified: true,
  datingMode: "Serious Dating",
  todaysNote: "Free tonight ✨ Let's grab wine somewhere nice",
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

const Profile = () => {
  const { profile } = useAuth();

  const favoriteArtists = (profile?.favorite_artists as string[] | null) || [];
  const favoriteGenres = (profile?.favorite_genres as string[] | null) || [];
  const favoriteSong = (profile?.favorite_song as string | null) || "";
  const hasMusicData = favoriteArtists.length > 0 || favoriteGenres.length > 0 || favoriteSong;

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
          <div className="flex gap-2">
            <Badge variant="primary">{mockProfile.datingMode}</Badge>
            <Button variant="ghost" size="icon"><Edit3 className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Today's Note */}
        <div className="glass rounded-xl p-4 mb-6 glow-border">
          <div className="flex items-center gap-2 text-xs text-primary font-bold mb-1">
            <Star className="w-3.5 h-3.5" /> TODAY'S NOTE
          </div>
          <p className="text-foreground">{mockProfile.todaysNote}</p>
        </div>

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
    </div>
  );
};

export default Profile;
