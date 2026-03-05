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
    await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: blockedUserId,
    } as any);
    toast({ title: "User blocked", description: "They can no longer see your profile or contact you." });
    setBlocking(false);
    onOpenChange(false);
    onBlocked?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleBlock} disabled={blocking}>
            {blocking ? "Blocking..." : "Confirm Block"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BlockConfirmDialog;
