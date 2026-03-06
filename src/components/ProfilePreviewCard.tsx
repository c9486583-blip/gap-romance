import { motion } from "framer-motion";
import { Shield, MapPin, MessageSquare, Heart, Music, Clock } from "lucide-react";
import { LIFESTYLE_ICONS, PERSONALITY_ICONS } from "@/lib/profile-constants";

interface ProfilePreviewCardProps {
  profile: any;
  onClose: () => void;
}

const getAge = (dob: string | null) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const isNoteActive = (updatedAt: string | null) => {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < 24 * 60 * 60 * 1000;
};

const ProfilePreviewCard = ({ profile, onClose }: ProfilePreviewCardProps) => {
  const photos = (profile?.photos as string[]) || [];
  const hobbies = (profile?.hobbies as string[]) || [];
  const lifestyleBadges = (profile?.lifestyle_badges as string[]) || [];
  const personalityBadges = (profile?.personality_badges as string[]) || [];
  const loveLanguage = (profile?.love_language as string) || "";
  const favoriteArtists = (profile?.favorite_artists as string[]) || [];
  const favoriteGenres = (profile?.favorite_genres as string[]) || [];
  const favoriteSong = (profile?.favorite_song as string) || "";
  const datingMode = (profile?.dating_mode as string) || "Both";
  const age = getAge(profile?.date_of_birth);
  const activeNote = profile?.todays_note && isNoteActive(profile?.todays_note_updated_at) ? profile.todays_note : null;
  const promptAnswers = (profile?.prompt_answers as any[]) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="max-w-lg mx-auto p-4 pb-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Profile Preview — as others see you</p>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4">
            <img src={photos[0]} alt="" className="w-full aspect-[4/5] object-cover" />
          </div>
        )}

        {/* Name & basics */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-heading font-bold">
              {profile?.first_name || "User"} {profile?.last_initial || ""}{age ? `, ${age}` : ""}
            </h2>
            {profile?.is_verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold border border-gold/30">
                <Shield className="w-3 h-3 mr-1" /> Verified
              </span>
            )}
          </div>
          {profile?.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {profile.city}
            </p>
          )}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30 mt-2">
            {datingMode === "Both" ? "Open to Both" : datingMode}
          </span>
        </div>

        {/* Today's Note */}
        {activeNote && (
          <div className="glass rounded-xl p-4 mb-4 glow-border">
            <div className="flex items-center gap-2 text-xs text-primary font-bold mb-1">
              <MessageSquare className="w-3.5 h-3.5" /> TODAY'S NOTE
            </div>
            <p className="text-primary/90 italic">{activeNote}</p>
          </div>
        )}

        {/* Bio */}
        {profile?.bio && (
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold mb-2">About</h3>
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Hobbies */}
        {hobbies.length > 0 && (
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold mb-2">Hobbies</h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((h) => (
                <span key={h} className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {lifestyleBadges.length > 0 && (
          <div className="mb-4">
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
          <div className="mb-4">
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

        {loveLanguage && (
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold mb-2">Love Language</h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">❤️ {loveLanguage}</span>
          </div>
        )}

        {/* Music */}
        {(favoriteArtists.length > 0 || favoriteGenres.length > 0 || favoriteSong) && (
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold mb-2 flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" /> Music Taste
            </h3>
            {favoriteArtists.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {favoriteArtists.map((a) => (
                  <span key={a} className="px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">{a}</span>
                ))}
              </div>
            )}
            {favoriteGenres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {favoriteGenres.map((g) => (
                  <span key={g} className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground"><Music className="w-3 h-3 inline mr-1" />{g}</span>
                ))}
              </div>
            )}
            {favoriteSong && <p className="text-sm">🎵 {favoriteSong}</p>}
          </div>
        )}

        {/* Prompts */}
        {promptAnswers.length > 0 && (
          <div className="space-y-3 mb-4">
            <h3 className="font-heading text-lg font-semibold">Prompts</h3>
            {promptAnswers.map((p: any, i: number) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="text-primary text-sm font-bold mb-1">{p.prompt}</p>
                <p className="text-foreground">{p.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Additional photos */}
        {photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {photos.slice(1).map((p, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={p} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors"
        >
          Close Preview
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePreviewCard;
