import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedUserId: string;
  blockedUserName: string;
  onBlocked?: () => void;
}

const BlockConfirmDialog = ({ open, onOpenChange, blockedUserId, blockedUserName, onBlocked }: BlockConfirmDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    if (!user) return;
    setBlocking(true);

    try {
      const { error } = await supabase.from("blocks").insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
      } as any);

      if (error) {
        toast({ title: "Failed to block user", description: error.message, variant: "destructive" });
        setBlocking(false);
        return;
      }

      // Close dialog first
      onOpenChange(false);
      setBlocking(false);

      // Show success toast
      toast({ title: "User has been blocked", description: "They can no longer see your profile or contact you." });

      // Callback to refresh parent state
      onBlocked?.();
    } catch (err: any) {
      toast({ title: "Failed to block user", variant: "destructive" });
      setBlocking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!blocking) onOpenChange(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" /> Block User
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to block {blockedUserName}? They will no longer be able to see your profile or contact you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleBlock} disabled={blocking}>
            {blocking ? "Blocking..." : "Yes, Block"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BlockConfirmDialog;
