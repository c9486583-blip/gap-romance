import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CreditSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !user) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-credit-purchase", {
          body: { session_id: sessionId },
        });
        if (error || !data?.success) {
          setStatus("error");
          return;
        }
        setCreditsAdded(data.credits_added);
        setTotalCredits(data.total_credits);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [searchParams, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <h1 className="text-2xl font-heading font-bold mb-2">Verifying purchase...</h1>
            <p className="text-muted-foreground">Please wait while we add your credits.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-heading font-bold mb-2">Credits Added!</h1>
            <p className="text-muted-foreground mb-4">
              <span className="text-primary font-bold text-lg">+{creditsAdded}</span> message credits have been added to your account.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Total credits: <span className="font-bold text-foreground">{totalCredits}</span>
            </p>
            <Button variant="hero" asChild>
              <Link to="/messages"><MessageCircle className="mr-2 w-4 h-4" /> Go to Messages</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-heading font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your purchase. If you were charged, your credits will be added automatically within a few minutes.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild><Link to="/messages">Back to Messages</Link></Button>
              <Button variant="hero" asChild><Link to="/contact">Contact Support</Link></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreditSuccess;
