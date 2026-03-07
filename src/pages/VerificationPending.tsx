import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Clock, AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import OnboardingProgress from "@/components/OnboardingProgress";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";

const VerificationPending = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("processing");
  const [lastError, setLastError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const checkStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-verification-status");
      if (!error && data) {
        setStatus(data.status);
        setLastError(data.last_error);
        if (data.is_verified) {
          // Mark as fully verified
          await supabase
            .from("profiles")
            .update({
              is_verified: true,
              verification_status: "verified",
              onboarding_step: ONBOARDING_STEPS.FULLY_VERIFIED,
            } as any)
            .eq("user_id", user.id);
          await refreshProfile();
          toast({ title: "🎉 You're verified!", description: "Welcome to GapRomance!" });
          navigate("/discover", { replace: true });
          return;
        }
        if (data.status === "failed" || data.status === "canceled" || data.status === "requires_input") {
          // Allow re-submission
          await supabase
            .from("profiles")
            .update({
              onboarding_step: ONBOARDING_STEPS.PROFILE_COMPLETE,
              verification_status: "failed",
            } as any)
            .eq("user_id", user.id);
        }
      }
    } catch (e) {
      console.error("Status check failed:", e);
    }
    setChecking(false);
  };

  useEffect(() => {
    if (!user) return;
    if (profile?.is_verified || profile?.onboarding_step >= ONBOARDING_STEPS.FULLY_VERIFIED) {
      navigate("/discover", { replace: true });
      return;
    }
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [user, profile?.is_verified]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-verification-session", {
        body: { return_url: `${window.location.origin}/verification-pending` },
      });
      if (!error && data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Failed to restart verification", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setRetrying(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in</p>
          <Button variant="hero" asChild><Link to="/login">Log In</Link></Button>
        </div>
      </div>
    );
  }

  const isFailed = status === "failed" || status === "canceled" || status === "requires_input";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <OnboardingProgress currentStep={5} totalSteps={6} stepLabel="Verification Pending" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
        {isFailed ? (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-heading font-bold mb-3">Verification Failed</h1>
            <p className="text-muted-foreground mb-4">
              {lastError
                ? `Unfortunately your verification could not be completed: ${lastError}`
                : "Your identity verification was not successful. This can happen if the ID photo was unclear or the selfie didn't match."}
            </p>
            <p className="text-sm text-muted-foreground mb-8">Don't worry — you can try again with a clearer photo.</p>
            <Button variant="hero" size="lg" onClick={handleRetry} disabled={retrying}>
              {retrying ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Starting...</> :
                <><RefreshCw className="mr-2 w-5 h-5" /> Try Again</>}
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <Clock className="w-10 h-10 text-primary" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-heading font-bold mb-3">Your verification is being reviewed</h1>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              This usually takes just a few minutes. We'll notify you as soon as you're approved.
            </p>

            <div className="glass rounded-2xl p-6 mb-8 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">ID document submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Selfie captured</span>
              </div>
              <div className="flex items-center gap-3">
                {checking ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">Awaiting review...</span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={checkStatus} disabled={checking}>
              {checking ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Checking...</> :
                <><RefreshCw className="mr-2 w-4 h-4" /> Check Status</>}
            </Button>

            <p className="text-xs text-muted-foreground mt-6">
              This page auto-refreshes every 15 seconds. You cannot access the platform until verification is complete.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerificationPending;
