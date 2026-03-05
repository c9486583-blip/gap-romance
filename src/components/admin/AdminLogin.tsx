import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LOCKOUT_KEY = "admin_lockout";
const ATTEMPTS_KEY = "admin_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const isLockedOut = () => {
    const lockout = localStorage.getItem(LOCKOUT_KEY);
    if (!lockout) return false;
    if (Date.now() < parseInt(lockout)) return true;
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    return false;
  };

  const getRemainingLockout = () => {
    const lockout = localStorage.getItem(LOCKOUT_KEY);
    if (!lockout) return 0;
    return Math.max(0, Math.ceil((parseInt(lockout) - Date.now()) / 60000));
  };

  const recordFailure = () => {
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0") + 1;
    localStorage.setItem(ATTEMPTS_KEY, attempts.toString());
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, (Date.now() + LOCKOUT_MS).toString());
      setError(`Too many failed attempts. Locked out for 30 minutes.`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut()) {
      setError(`Account locked. Try again in ${getRemainingLockout()} minutes.`);
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      recordFailure();
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (!isAdmin) {
      await supabase.auth.signOut();
      recordFailure();
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
    toast({ title: "Welcome back, Admin" });
    onSuccess();
    setLoading(false);
  };

  const remainingAttempts = MAX_ATTEMPTS - parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass rounded-2xl p-8">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">GapRomance Administration</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {remainingAttempts <= 3 && remainingAttempts > 0 && !isLockedOut() && (
            <p className="text-xs text-muted-foreground">{remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining before lockout</p>
          )}
          <Button type="submit" className="w-full" variant="hero" disabled={loading || isLockedOut()}>
            <Lock className="w-4 h-4 mr-2" /> {loading ? "Verifying..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
