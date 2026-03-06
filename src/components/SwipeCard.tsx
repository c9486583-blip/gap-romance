import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Shield, MessageSquare, Star } from "lucide-react";

interface SwipeCardProps {
  profile: any;
  onSwipe: (direction: "left" | "right") => void;
  onTap: () => void;
  myHobbies: string[];
  getAge: (dob: string | null) => number | null;
  getDistance: (p: any) => number | null;
}

const SwipeCard = ({ profile, onSwipe, onTap, myHobbies, getAge, getDistance }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const age = getAge(profile.date_of_birth);
  const dist = getDistance(profile);
  const displayName = `${profile.first_name || "User"} ${profile.last_initial || ""}`.trim();
  const profileHobbies: string[] = profile.hobbies || [];
  const hasNote = profile.todays_note && profile.todays_note_updated_at &&
    (Date.now() - new Date(profile.todays_note_updated_at).getTime() < 24 * 60 * 60 * 1000);

  const datingModeLabel = profile.dating_mode === "Serious Dating" ? "Serious" :
    profile.dating_mode === "Casual Dating" ? "Casual" : "Open";

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe("right");
    } else if (info.offset.x < -120) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      exit={{ x: 0, opacity: 0, transition: { duration: 0.3 } }}
      onClick={(e) => {
        // Only tap if not dragging
        if (Math.abs(x.get()) < 5) onTap();
      }}
    >
      {/* Card */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card shadow-2xl">
        {/* Main photo */}
        <div className="absolute inset-0">
          {profile.photos && profile.photos[0] ? (
            <img src={profile.photos[0]} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-7xl font-heading text-muted-foreground">{(profile.first_name || "?")[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Like/Pass overlay indicators */}
        <motion.div
          className="absolute top-8 right-8 border-4 border-primary rounded-xl px-4 py-2 z-20"
          style={{ opacity: likeOpacity, rotate: -15 }}
        >
          <span className="text-primary font-heading text-3xl font-bold">LIKE</span>
        </motion.div>
        <motion.div
          className="absolute top-8 left-8 border-4 border-destructive rounded-xl px-4 py-2 z-20"
          style={{ opacity: passOpacity, rotate: 15 }}
        >
          <span className="text-destructive font-heading text-3xl font-bold">PASS</span>
        </motion.div>

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              {displayName}{age ? `, ${age}` : ""}
            </h2>
            {profile.is_verified && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-primary border border-primary/30">
              {datingModeLabel}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.city || "Nearby"}</span>
              {dist !== null && <span className="text-primary font-bold">· {dist} mi</span>}
            </div>
          </div>

          {hasNote && (
            <div className="flex items-start gap-1.5 mb-3 glass rounded-lg px-3 py-2">
              <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-primary/90 italic text-sm line-clamp-2">{profile.todays_note}</span>
            </div>
          )}

          {profileHobbies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profileHobbies.slice(0, 5).map((h: string) => {
                const isShared = myHobbies.includes(h);
                return (
                  <span key={h} className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    isShared
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary/80 text-secondary-foreground"
                  }`}>
                    {h}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
