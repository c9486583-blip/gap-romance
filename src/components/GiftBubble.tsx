import { motion } from "framer-motion";

interface GiftBubbleProps {
  emoji: string;
  name: string;
  fromMe: boolean;
}

const GiftBubble = ({ emoji, name, fromMe }: GiftBubbleProps) => (
  <div className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20"
    >
      <motion.span
        className="text-5xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {emoji}
      </motion.span>
      <span className="text-xs text-primary font-semibold">{name}</span>
    </motion.div>
  </div>
);

export default GiftBubble;
