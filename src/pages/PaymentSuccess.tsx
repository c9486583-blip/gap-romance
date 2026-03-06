import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ArrowRight, MessageCircle, Clock, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [timeDetails, setTimeDetails] = useState<{ unlimited?: boolean; seconds_added?: number } | null>(null);
  const [isGiftPurchase, setIsGiftPurchase] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("success");
      return;
    }

    const verify = async () => {
      try {
        // Try verifying as a time credit purchase
        if (user) {
          const { data } = await supabase.functions.invoke("verify-credit-purchase", {
            body: { session_id: sessionId },
          });
          if (data?.success && data?.type === "time_credit") {
            setTimeDetails({ unlimited: data.unlimited, seconds_added: data.seconds_added });
          }
        }
        // Refresh subscription status
        if (refreshSubscription) await refreshSubscription();

        // Check for pending gift purchase
        const pendingGiftStr = sessionStorage.getItem("pending_gift");
        if (pendingGiftStr && user) {
          try {
            const pendingGift = JSON.parse(pendingGiftStr);
            sessionStorage.removeItem("pending_gift");
            setIsGiftPurchase(true);
            // Store completed gift info for Messages page to process
            sessionStorage.setItem("pending_gift_complete", JSON.stringify({
              gift: pendingGift.gift,
              recipientId: pendingGift.recipientId,
              matchId: pendingGift.matchId,
            }));
          } catch (e) {
            console.error("Error processing pending gift:", e);
          }
        }

        setStatus("success");
      } catch {
        setStatus("success"); // Still show success — Stripe handled the payment
      }
    };
    verify();
  }, [searchParams, user]);

  const getTimeLabel = () => {
    if (!timeDetails) return null;
    if (timeDetails.unlimited) return "Unlimited messaging today";
    if (timeDetails.seconds_added === 1800) return "30 minutes";
    if (timeDetails.seconds_added === 7200) return "2 hours";
    return `${Math.round((timeDetails.seconds_added || 0) / 60)} minutes`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <h1 className="text-2xl font-heading font-bold mb-2">Verifying your purchase…</h1>
            <p className="text-muted-foreground">This only takes a moment.</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-14 h-14 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-heading font-bold mb-2">
              {isGiftPurchase ? "Gift Purchased!" : "Payment Successful!"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isGiftPurchase
                ? "Your gift will be sent when you return to the chat."
                : "Thank you for your purchase. Your account has been updated."}
            </p>

            {timeDetails && (
              <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold">+{getTimeLabel()}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {isGiftPurchase ? (
                <>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/messages"><Gift className="mr-2 w-4 h-4" /> Send Gift in Chat</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/discover"><ArrowRight className="mr-2 w-4 h-4" /> Continue Exploring</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/messages"><MessageCircle className="mr-2 w-4 h-4" /> Go to Messages</Link>
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
