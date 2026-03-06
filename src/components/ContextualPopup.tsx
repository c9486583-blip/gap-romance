import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Crown, Zap, Heart, Rocket, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { STRIPE_PRODUCTS, STRIPE_ADDONS, STRIPE_COUPON_WELCOME } from "@/lib/stripe-products";
import { ReactNode } from "react";

interface ContextualPopupProps {
  open: boolean;
  onClose: () => void;
  type: "filters" | "likes" | "sevenDay" | "superLike" | "boostExpired" | "welcomeBack";
}

const popupConfigs: Record<ContextualPopupProps["type"], {
  icon: ReactNode;
  title: string;
  message: string;
  ctaLabel: string;
  ctaVariant: "hero" | "gold";
  priceId?: string;
  mode?: "subscription" | "payment";
  discount?: boolean;
  linkTo?: string;
}> = {
  filters: {
    icon: <Zap className="w-7 h-7 text-primary" />,
    title: "Unlock Advanced Filters",
    message: "Advanced filters are a Premium feature. Upgrade to unlock full filtering and find exactly who you're looking for.",
    ctaLabel: "Upgrade to Premium",
    ctaVariant: "hero",
    priceId: STRIPE_PRODUCTS.premium.price_id,
    mode: "subscription",
  },
  likes: {
    icon: <Heart className="w-7 h-7 text-primary" />,
    title: "See Who Likes You",
    message: "Want to see who already likes you? Upgrade to Premium and start matching faster.",
    ctaLabel: "Upgrade to Premium",
    ctaVariant: "hero",
    priceId: STRIPE_PRODUCTS.premium.price_id,
    mode: "subscription",
  },
  sevenDay: {
    icon: <Crown className="w-7 h-7 text-primary" />,
    title: "You've been here a week! 🎉",
    message: "You've been on GapRomance for a week — upgrade to Premium and take your experience to the next level. Get 20% off your first month!",
    ctaLabel: "Get 20% Off Premium",
    ctaVariant: "hero",
    priceId: STRIPE_PRODUCTS.premium.price_id,
    mode: "subscription",
    discount: true,
  },
  superLike: {
    icon: <Star className="w-7 h-7 text-primary" />,
    title: "Really interested?",
    message: "Send them a Super Like so they know you're serious — you'll stand out from the crowd.",
    ctaLabel: "Buy Super Like — $2",
    ctaVariant: "hero",
    priceId: STRIPE_ADDONS.superLike.price_id,
    mode: "payment",
  },
  boostExpired: {
    icon: <Rocket className="w-7 h-7 text-primary" />,
    title: "Your boost has ended",
    message: "Your profile boost has expired. Boost again to stay at the top of discovery.",
    ctaLabel: "Buy Another Boost — $5",
    ctaVariant: "hero",
    priceId: STRIPE_ADDONS.boost.price_id,
    mode: "payment",
  },
  welcomeBack: {
    icon: <Crown className="w-7 h-7 text-primary" />,
    title: "Welcome back! 👋",
    message: "Great to see you again! Here's a special offer — upgrade to Premium at 20% off and take your dating experience to the next level.",
    ctaLabel: "Get 20% Off Premium",
    ctaVariant: "hero",
    priceId: STRIPE_PRODUCTS.premium.price_id,
    mode: "subscription",
    discount: true,
  },
};

const ContextualPopup = ({ open, onClose, type }: ContextualPopupProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = popupConfigs[type];

  const handleCta = async () => {
    if (!config.priceId) return;
    if (!user) {
      navigate("/signup?redirect=/pricing");
      onClose();
      return;
    }
    try {
      const body: any = {
        priceId: config.priceId,
        mode: config.mode || "subscription",
      };
      if (config.discount) {
        body.coupon = STRIPE_COUPON_WELCOME;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", { body });
      if (error) {
        const errMsg = typeof data === "object" && data?.error ? data.error : error.message;
        toast({ title: "Checkout failed", description: errMsg, variant: "destructive" });
        return;
      }
      if (!data?.url) {
        toast({ title: "Checkout failed", description: "No checkout URL returned", variant: "destructive" });
        return;
      }
      window.location.href = data.url;
      onClose();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl p-6 max-w-sm w-full relative text-center"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {config.icon}
            </div>

            <h3 className="font-heading text-xl font-bold mb-2">{config.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{config.message}</p>

            <Button variant={config.ctaVariant} size="lg" className="w-full" onClick={handleCta}>
              {config.ctaLabel}
            </Button>

            <button onClick={onClose} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
              No thanks, maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextualPopup;
