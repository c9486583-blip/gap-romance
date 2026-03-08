import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { VIRTUAL_GIFTS, VirtualGift } from "@/lib/virtual-gifts";

interface GiftPickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (gift: VirtualGift) => void;
}

const GiftPicker = ({ open, onClose, onSend }: GiftPickerProps) => {
  const [sending, setSending] = useState<string | null>(null);

  const handleSend = (gift: VirtualGift) => {
    setSending(gift.id);
    onSend(gift);
    setTimeout(() => {
      setSending(null);
      onClose();
    }, 600);
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
                onClick={() => handleSend(gift)}
                disabled={sending === gift.id}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <span className="text-2xl">{gift.emoji}</span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{gift.name}</span>
                <span className="text-[10px] font-bold text-primary">${gift.price}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftPicker;
