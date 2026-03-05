import { motion } from "framer-motion";

interface GiftBubbleProps {
  emoji: string;
  name: string;
  fromMe: boolean;
}

const giftAnimationClass: Record<string, string> = {
  "🌹": "gift-float-up",
  "🥂": "gift-pop-bubbles",
  "💍": "gift-sparkle",
  "🔥": "gift-flicker",
  "👑": "gift-drop-shine",
  "❤️": "gift-pulse-heart",
  "🍫": "gift-bounce",
  "🛥️": "gift-slide-in",
  "✈️": "gift-fly-across",
  "🎁": "gift-shake-open",
};

const GiftBubble = ({ emoji, name, fromMe }: GiftBubbleProps) => {
  const animClass = giftAnimationClass[emoji] || "gift-bounce";

  return (
    <div className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 overflow-hidden"
      >
        <span className={`text-5xl inline-block ${animClass}`}>
          {emoji}
        </span>
        <span className="text-xs text-primary font-semibold">{name}</span>
      </motion.div>
    </div>
  );
};

export default GiftBubble;
