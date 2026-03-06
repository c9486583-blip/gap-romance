import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { VIRTUAL_GIFTS, VirtualGift } from "@/lib/virtual-gifts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface GiftPickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (gift: VirtualGift) => void;
  recipientId?: string;
  matchId?: string | null;
}

const GiftPicker = ({ open, onClose, onSend, recipientId, matchId }: GiftPickerProps) => {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePurchase = async (gift: VirtualGift) => {
    if (!user) {
      toast({ title: "Please log in to send gifts", variant: "destructive" });
      return;
    }

    setPurchasing(gift.id);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setPurchasing(null);
        return;
      }

      // Store gift info so we can send it after payment
      sessionStorage.setItem("pending_gift", JSON.stringify({
        gift,
        recipientId,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            priceId: gift.price_id,
            mode: "payment",
            successUrl: "/payment-success",
          }),
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-full left-0 right-0 mb-2 glass rounded-2xl p-4 z-20"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-heading font-bold text-sm">Send a Gift</h4>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {VIRTUAL_GIFTS.map((gift) => (
              <motion.button
                key={gift.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePurchase(gift)}
                disabled={purchasing !== null}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors relative"
              >
                {purchasing === gift.id ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <span className="text-2xl">{gift.emoji}</span>
                )}
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{gift.name}</span>
                <span className="text-[10px] font-bold text-primary">${gift.price}</span>
              </motion.button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Payment processed securely via Stripe
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftPicker;
