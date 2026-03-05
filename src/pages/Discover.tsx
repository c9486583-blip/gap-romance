import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Shield, Filter, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";

const mockProfiles = [
  {
    id: 1, name: "Sophia M.", age: 24, location: "Los Angeles", verified: true,
    mode: "Serious", note: "Free tonight ✨",
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
    hobbies: ["Travel", "Art", "Yoga"],
  },
  {
    id: 2, name: "Emma R.", age: 22, location: "Miami", verified: true,
    mode: "Casual", note: "Beach vibes today 🌊",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    hobbies: ["Fitness", "Dancing", "Cooking"],
  },
  {
    id: 3, name: "Isabella K.", age: 26, location: "New York", verified: false,
    mode: "Both", note: "Looking for deep conversations",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
    hobbies: ["Reading", "Music", "Photography"],
  },
  {
    id: 4, name: "Mia L.", age: 21, location: "San Francisco", verified: true,
    mode: "Serious", note: "Let's explore the city 🏙️",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
    hobbies: ["Hiking", "Wine Tasting", "Travel"],
  },
  {
    id: 5, name: "Olivia T.", age: 23, location: "Chicago", verified: true,
    mode: "Casual", note: "In a great mood 😊",
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
    hobbies: ["Fashion", "Art", "Movies"],
  },
  {
    id: 6, name: "Ava W.", age: 25, location: "Austin", verified: false,
    mode: "Serious", note: "Sushi date anyone? 🍣",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
    hobbies: ["Cooking", "Yoga", "Music"],
  },
];

const Discover = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [modeFilter, setModeFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = mockProfiles.filter((p) => {
    if (modeFilter !== "All" && p.mode !== modeFilter && p.mode !== "Both") return false;
    if (verifiedOnly && !p.verified) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/profile">Profile</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/messages">Messages</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/settings">Settings</Link></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by name or location..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <Button
            variant={showFilters ? "hero" : "outline"}
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="glass rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Dating Mode</label>
              <div className="flex gap-2">
                {["All", "Serious", "Casual"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModeFilter(m)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      modeFilter === m
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Age Range</label>
              <div className="flex items-center gap-3">
                <input type="number" defaultValue={18} min={18} max={80} className="w-20 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground" />
                <span className="text-muted-foreground">to</span>
                <input type="number" defaultValue={60} min={18} max={80} className="w-20 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Options</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-foreground">Verified profiles only</span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden hover-lift group"
            >
              <div className="relative aspect-[4/5]">
                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-xl font-bold">{p.name}, {p.age}</h3>
                    {p.verified && <Shield className="w-4 h-4 text-gold" />}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-3 h-3" /> {p.location}
                  </div>
                  <div className="flex items-center gap-1 text-sm mb-3">
                    <Star className="w-3 h-3 text-primary" />
                    <span className="text-foreground/80">{p.note}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.hobbies.map((h) => (
                      <span key={h} className="text-xs bg-secondary/80 px-2 py-0.5 rounded-full text-secondary-foreground">{h}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full border border-border bg-background/50">
                      <X className="w-5 h-5" />
                    </Button>
                    <Button variant="hero" size="icon" className="rounded-full flex-1">
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Discover;
