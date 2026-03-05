import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminReports from "@/components/admin/AdminReports";
import AdminModeration from "@/components/admin/AdminModeration";
import AdminRevenue from "@/components/admin/AdminRevenue";
import AdminVerification from "@/components/admin/AdminVerification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Shield, BarChart3, Users, Flag, MessageSquareWarning, DollarSign, BadgeCheck, LogOut, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/NotFound";

const AdminSetup = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("setup-admin", {
      body: { password },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || "Setup failed");
      setLoading(false);
      return;
    }

    toast({ title: "Admin account created! Please log in." });
    // Sign in with the new credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: "lt.inbox@proton.me",
      password,
    });

    if (signInError) {
      setError("Account created but login failed. Go to /admin and log in manually.");
    }
    setLoading(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass rounded-2xl p-8">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold">Admin Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Set your admin password for the first time.</p>
          <p className="text-xs text-muted-foreground mt-1">Email: lt.inbox@proton.me</p>
        </div>
        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <Label htmlFor="setup-password">Password</Label>
            <Input id="setup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" />
          </div>
          <div>
            <Label htmlFor="setup-confirm">Confirm Password</Label>
            <Input id="setup-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" variant="hero" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</> : <><Lock className="w-4 h-4 mr-2" /> Create Admin Account</>}
          </Button>
        </form>
      </div>
    </div>
  );
};

const AdminLoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const LOCKOUT_KEY = "admin_lockout";
  const ATTEMPTS_KEY = "admin_attempts";
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 30 * 60 * 1000;

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
      setError("Too many failed attempts. Locked out for 30 minutes.");
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
      // Don't reveal that admin exists — show generic error
      setError("Invalid credentials.");
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
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {remainingAttempts <= 3 && remainingAttempts > 0 && !isLockedOut() && (
            <p className="text-xs text-muted-foreground">{remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining</p>
          )}
          <Button type="submit" className="w-full" variant="hero" disabled={loading || isLockedOut()}>
            <Lock className="w-4 h-4 mr-2" /> {loading ? "Verifying..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkAdminExists = async () => {
      // Check if any admin role exists in the system
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin" as any)
        .limit(1);
      setAdminExists(data && data.length > 0);
    };
    checkAdminExists();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user, authLoading]);

  // Still loading
  if (authLoading || isAdmin === null || adminExists === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // First-time setup: no admin exists yet
  if (!adminExists) {
    return <AdminSetup />;
  }

  // User is logged in but NOT admin → show 404 (stealth)
  if (user && !isAdmin) {
    return <NotFound />;
  }

  // Not logged in → show admin login form
  if (!user) {
    return <AdminLoginForm onSuccess={() => setIsAdmin(true)} />;
  }

  // Admin is authenticated
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="users" className="gap-1"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1"><Flag className="w-3.5 h-3.5" />Reports</TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1"><MessageSquareWarning className="w-3.5 h-3.5" />Moderation</TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1"><DollarSign className="w-3.5 h-3.5" />Revenue</TabsTrigger>
            <TabsTrigger value="verification" className="gap-1"><BadgeCheck className="w-3.5 h-3.5" />Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="reports"><AdminReports /></TabsContent>
          <TabsContent value="moderation"><AdminModeration /></TabsContent>
          <TabsContent value="revenue"><AdminRevenue /></TabsContent>
          <TabsContent value="verification"><AdminVerification /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
