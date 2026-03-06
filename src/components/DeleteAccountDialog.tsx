import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  user: any;
  signOut: () => Promise<void>;
}

const DeleteAccountDialog = ({ user, signOut }: DeleteAccountDialogProps) => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    setDeleting(true);

    try {
      // Verify password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (signInError) {
        setError("Incorrect password. Please try again.");
        setDeleting(false);
        return;
      }

      // Password correct — proceed with deletion
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setError("Session expired. Please log in again.");
        setDeleting(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        setError(result?.error || "Failed to delete account.");
        setDeleting(false);
        return;
      }

      await signOut();
      navigate("/");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="w-4 h-4 mr-2" /> Delete Account
      </Button>

      <AlertDialog open={open} onOpenChange={(v) => { if (!deleting) { setOpen(v); setPassword(""); setError(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This cannot be undone. All your data, photos, matches, and messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium block">Enter your password to confirm:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Your current password"
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-destructive"
              disabled={deleting}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || !password.trim()}>
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Yes, Delete My Account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteAccountDialog;
