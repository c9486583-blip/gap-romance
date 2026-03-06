import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Heart, Star, ChevronLeft, ChevronRight, MapPin, Shield, MessageSquare, Music } from "lucide-react";
import { LIFESTYLE_ICONS, PERSONALITY_ICONS } from "@/lib/profile-constants";

interface ExpandedProfileProps {
  profile: any;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  myHobbies: string[];
  myGenres: string[];
  getAge: (dob: string | null) => number | null;
  getDistance: (p: any) => number | null;
}

const ExpandedProfile = ({ profile, onClose, onLike, onPass, onSuperLike, myHobbies, myGenres, getAge, getDistance }: ExpandedProfileProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos: string[] = profile.photos || [];
  const age = getAge(profile.date_of_birth);
  const dist = getDistance(profile);
  const displayName = `${profile.first_name || "User"} ${profile.last_initial || ""}`.trim();
  const hobbies: string[] = profile.hobbies || [];
  const lifestyleBadges: string[] = profile.lifestyle_badges || [];
  const personalityBadges: string[] = profile.personality_badges || [];
  const favoriteArtists: string[] = profile.favorite_artists || [];
  const favoriteGenres: string[] = profile.favorite_genres || [];
  const favoriteSong: string = profile.favorite_song || "";
  const loveLanguage: string = profile.love_language || "";
  const prompts: any[] = profile.prompt_answers || [];
  const bio = profile.bio || "";
  const datingMode = profile.dating_mode === "Serious Dating" ? "Serious Dating" :
    profile.dating_mode === "Casual Dating" ? "Casual Dating" : "Open to Both";

  const hasNote = profile.todays_note && profile.todays_note_updated_at &&
    (Date.now() - new Date(profile.todays_note_updated_at).getTime() < 24 * 60 * 60 * 1000);

  const nextPhoto = () => setPhotoIndex((i) => Math.min(i + 1, photos.length - 1));
  const prevPhoto = () => setPhotoIndex((i) => Math.max(i - 1, 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background overflow-y-auto"
    >
      {/* Photo carousel */}
      <div className="relative w-full aspect-[3/4] max-h-[70vh] bg-secondary">
        {photos.length > 0 ? (
          <img src={photos[photoIndex]} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl font-heading text-muted-foreground">{(profile.first_name || "?")[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Photo navigation */}
        {photos.length > 1 && (
          <>
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 z-10">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === photoIndex ? "w-8 bg-primary" : "w-4 bg-foreground/30"}`} />
              ))}
            </div>
            <button onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
            <button onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" />
          </>
        )}

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full glass flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile content */}
      <div className="px-5 pb-32 -mt-12 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-heading text-3xl font-bold">{displayName}{age ? `, ${age}` : ""}</h1>
          {profile.is_verified && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-primary border border-primary/30">
            {datingMode}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{profile.city || "Nearby"}</span>
            {dist !== null && <span className="text-primary font-bold">· {dist} mi</span>}
          </div>
        </div>

        {hasNote && (
          <div className="glass rounded-xl p-4 mb-5 glow-border">
            <div className="flex items-center gap-2 text-xs text-primary font-bold mb-1">
              <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
            </div>
            <p className="text-primary/90 italic">{profile.todays_note}</p>
          </div>
        )}

        {bio && (
          <div className="mb-5">
            <h3 className="font-heading text-lg font-semibold mb-2">About</h3>
            <p className="text-muted-foreground leading-relaxed">{bio}</p>
          </div>
        )}

        {hobbies.length > 0 && (
          <div className="mb-5">
            <h3 className="font-heading text-lg font-semibold mb-2">Hobbies</h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((h) => {
                const isShared = myHobbies.includes(h);
                return (
                  <span key={h} className={`text-xs px-3 py-1 rounded-full font-bold ${
                    isShared ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-secondary-foreground"
                  }`}>{h}</span>
                );
              })}
            </div>
          </div>
        )}

        {(lifestyleBadges.length > 0 || personalityBadges.length > 0) && (
          <div className="grid grid-cols-2 gap-5 mb-5">
            {lifestyleBadges.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">Lifestyle</h3>
                <div className="flex flex-wrap gap-2">
                  {lifestyleBadges.map((l) => (
                    <span key={l} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                      <span>{LIFESTYLE_ICONS[l]}</span> {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {personalityBadges.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">Personality</h3>
                <div className="flex flex-wrap gap-2">
                  {personalityBadges.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                      <span>{PERSONALITY_ICONS[p]}</span> {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loveLanguage && (
          <div className="mb-5">
            <h3 className="font-heading text-lg font-semibold mb-2">Love Language</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
              ❤️ {loveLanguage}
            </span>
          </div>
        )}

        {(favoriteArtists.length > 0 || favoriteGenres.length > 0 || favoriteSong) && (
          <div className="mb-5">
            <h3 className="font-heading text-lg font-semibold mb-2 flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" /> Music Taste
            </h3>
            {favoriteArtists.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Artists</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteArtists.map((a) => (
                    <span key={a} className="text-xs px-3 py-1 rounded-full font-bold bg-primary/15 text-primary border border-primary/30">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {favoriteGenres.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteGenres.map((g) => {
                    const isShared = myGenres.includes(g);
                    return (
                      <span key={g} className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
                        isShared ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-secondary-foreground"
                      }`}><Music className="w-2.5 h-2.5" /> {g}</span>
                    );
                  })}
                </div>
              </div>
            )}
            {favoriteSong && <p className="text-sm text-foreground">🎵 {favoriteSong}</p>}
          </div>
        )}

        {prompts.length > 0 && (
          <div className="space-y-3 mb-5">
            <h3 className="font-heading text-lg font-semibold">Prompts</h3>
            {prompts.map((p: any, i: number) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="text-primary text-sm font-bold mb-1">{p.q}</p>
                <p className="text-foreground">{p.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] glass border-t border-border/30 p-4">
        <div className="flex items-center justify-center gap-6 max-w-sm mx-auto">
          <button onClick={onPass}
            className="w-14 h-14 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors">
            <X className="w-7 h-7" />
          </button>
          <button onClick={onSuperLike}
            className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            <Star className="w-6 h-6" />
          </button>
          <button onClick={onLike}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/30">
            <Heart className="w-7 h-7" fill="currentColor" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ExpandedProfile;
