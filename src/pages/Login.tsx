import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { getOnboardingRoute, ONBOARDING_STEPS } from "@/lib/onboarding-steps";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // If already logged in, redirect to correct step
  useEffect(() => {
    if (user && profile) {
      const step = profile.onboarding_step ?? 0;
      if (step >= ONBOARDING_STEPS.FULLY_VERIFIED) {
        navigate("/discover", { replace: true });
      } else if (step >= 1) {
        navigate(getOnboardingRoute(step), { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: "Please enter your email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        // Profile will load via AuthContext, redirect happens in useEffect above
        // But also do immediate redirect based on profile fetch
        if (data.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("onboarding_step")
            .eq("user_id", data.user.id)
            .single();
          const step = profileData?.onboarding_step ?? 0;
          if (step >= ONBOARDING_STEPS.FULLY_VERIFIED) {
            navigate("/discover", { replace: true });
          } else {
            navigate(getOnboardingRoute(Math.max(step, 1)), { replace: true });
          }
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast({ title: "Login failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-heading font-bold text-gradient">GapRomance</Link>
          <p className="text-muted-foreground mt-2">Welcome back</p>
        </div>
        <div className="glass rounded-2xl p-8">
          <div className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            <Button variant="hero" className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Logging in...</> : "Log In"}
            </Button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
