import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, Crown, X, Zap } from "lucide-react";
import { STRIPE_TIME_CREDITS, STRIPE_PRODUCTS } from "@/lib/stripe-products";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface MessagingTimePopupProps {
  open: boolean;
  onClose: () => void;
}

const timeOptions = [
  { ...STRIPE_TIME_CREDITS.thirtyMin, label: "30 extra minutes", icon: "⏱️" },
  { ...STRIPE_TIME_CREDITS.twoHours, label: "2 extra hours", icon: "⏰" },
  { ...STRIPE_TIME_CREDITS.unlimitedDay, label: "Unlimited messaging today", icon: "♾️" },
];

const MessagingTimePopup = ({ open, onClose }: MessagingTimePopupProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    setPurchasing(priceId);
    if (!user) {
      sessionStorage.setItem("pending_checkout", JSON.stringify({ priceId, mode: "payment", successUrl: "/payment-success" }));
      navigate("/signup?redirect=/pricing");
      onClose();
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        toast({ title: "Please log in again", description: "Your session has expired.", variant: "destructive" });
        setPurchasing(null);
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ priceId, mode: "payment", successUrl: "/payment-success" }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "Checkout failed", description: result?.error || "Unknown error", variant: "destructive" });
      } else if (result?.url) {
        window.location.href = result.url;
      } else {
        toast({ title: "Checkout failed", description: "No checkout URL returned", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setPurchasing(null);
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
            className="glass rounded-2xl p-6 max-w-md w-full relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-1">Time's up!</h3>
              <p className="text-sm text-muted-foreground">
                Want to keep the conversation going?
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {timeOptions.map((opt) => (
                <button
                  key={opt.price_id}
                  onClick={() => handlePurchase(opt.price_id)}
                  disabled={purchasing === opt.price_id}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-all bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </div>
                  <span className="text-primary font-bold">${opt.price.toFixed(2)}</span>
                </button>
              ))}
            </div>

            <div className="text-center border-t border-border/30 pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                Or never worry about time again
              </p>
              <Button variant="hero" size="sm" asChild>
                <Link to="/pricing">
                  <Crown className="w-4 h-4 mr-2" /> Upgrade to Premium — $19.99/mo
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessagingTimePopup;
