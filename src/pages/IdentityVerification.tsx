import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Camera, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const IdentityVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startVerification = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-verification-session", {
        body: {
          return_url: `${window.location.origin}/verification-pending`,
        },
      });

      if (error || !data?.url) {
        toast({
          title: "Unable to start verification",
          description: data?.error || error?.message || "Please try again",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Redirect to Stripe Identity verification page
      window.location.href = data.url;
    } catch (e) {
      toast({ title: "Something went wrong", variant: "destructive" });
      setLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-heading font-bold mb-3">Verify Your Identity</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          All GapRomance users are required to verify their identity to keep the platform safe and
          trustworthy. Verification is <span className="text-primary font-semibold">completely free</span>.
        </p>

        <div className="glass rounded-2xl p-8 mb-8 text-left space-y-6">
          <h3 className="font-heading text-lg font-bold text-center mb-4">What you'll need</h3>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Government-issued ID</p>
              <p className="text-sm text-muted-foreground">Passport, driver's license, or national ID card</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Real-time selfie</p>
              <p className="text-sm text-muted-foreground">A quick selfie to match your face to your ID photo</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Usually takes 2–3 minutes</p>
              <p className="text-sm text-muted-foreground">Results are typically ready within a few minutes</p>
            </div>
          </div>
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full max-w-sm mx-auto"
          onClick={startVerification}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Starting Verification...</>
          ) : (
            <><Shield className="mr-2 w-5 h-5" /> Begin Verification</>
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Your data is securely processed and never shared. We use industry-standard encryption to protect your information.
        </p>
      </motion.div>
    </div>
  );
};

export default IdentityVerification;
