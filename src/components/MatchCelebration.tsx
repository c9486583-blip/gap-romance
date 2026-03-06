import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface MatchCelebrationProps {
  myPhoto: string | null;
  theirPhoto: string | null;
  theirName: string;
  matchId: string;
  onMessage: () => void;
  onKeepSwiping: () => void;
}

const MatchCelebration = ({ myPhoto, theirPhoto, theirName, onMessage, onKeepSwiping }: MatchCelebrationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-xl"
    >
      <div className="text-center px-6">
        {/* Floating hearts background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "100vh", x: `${10 + Math.random() * 80}vw`, opacity: 0.6 }}
              animate={{ y: "-10vh", opacity: 0 }}
              transition={{ duration: 3 + Math.random() * 2, delay: i * 0.2, repeat: Infinity }}
              className="absolute"
            >
              <Heart className="w-6 h-6 text-primary/40" fill="currentColor" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-gradient mb-8">
            It's a Match!
          </h1>
        </motion.div>

        {/* Profile photos */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-xl shadow-primary/20">
              {myPhoto ? (
                <img src={myPhoto} alt="You" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center text-3xl font-heading text-muted-foreground">You</div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.6 }}
          >
            <Heart className="w-10 h-10 text-primary" fill="currentColor" />
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-xl shadow-primary/20">
              {theirPhoto ? (
                <img src={theirPhoto} alt={theirName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center text-3xl font-heading text-muted-foreground">{theirName[0]}</div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground mb-8 text-lg"
        >
          You and <span className="text-primary font-bold">{theirName}</span> liked each other
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col gap-3 max-w-xs mx-auto"
        >
          <Button variant="hero" size="lg" className="w-full" onClick={onMessage}>
            Send a Message
          </Button>
          <Button variant="hero-outline" size="lg" className="w-full" onClick={onKeepSwiping}>
            Keep Swiping
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MatchCelebration;
