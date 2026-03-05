import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";

const NotificationPrompt = () => {
  const { user, profile } = useAuth();
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !profile || !isSupported) return;
    if (permission === "granted" || isSubscribed) return;
    if (permission === "denied") return;

    // Check if dismissed recently (3-day cooldown)
    const dismissedAt = profile.notification_prompt_dismissed_at;
    if (dismissedAt) {
      const daysSince = (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return;
    }

    // Show after a short delay
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [user, profile, isSupported, permission, isSubscribed]);

  const handleAllow = async () => {
    const success = await subscribe();
    if (success) {
      setVisible(false);
    }
  };

  const handleDismiss = async () => {
    setVisible(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ notification_prompt_dismissed_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-4 right-4 z-[100] max-w-md mx-auto"
        >
          <div className="glass rounded-2xl p-5 glow-border shadow-2xl">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-foreground mb-1">
                  Turn on notifications
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  So you never miss a match or message.
                </p>
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" onClick={handleAllow}>
                    Allow
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismiss}>
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
