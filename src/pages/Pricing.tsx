import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, Shield, Clock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRODUCTS, STRIPE_ADDONS, STRIPE_TIME_CREDITS } from "@/lib/stripe-products";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free", price: "$0", period: "forever", icon: Sparkles,
    features: ["Browse profiles", "Limited likes per day", "Basic filters", "1 hour messaging time/day"],
    cta: "Get Started", variant: "outline" as const, popular: false, priceId: null,
  },
  {
    name: "Premium", price: "$19.99", period: "/month", icon: Zap,
    features: ["Everything in Free", "Unlimited messaging time", "See who liked you", "Advanced filters", "Read receipts", "No ads"],
    cta: "Go Premium", variant: "hero" as const, popular: true, priceId: STRIPE_PRODUCTS.premium.price_id,
  },
  {
    name: "Elite", price: "$34.99", period: "/month", icon: Crown,
    features: ["Everything in Premium", "Weekly profile boost", "Priority in search", "Spotlight badge", "Elite support", "Exclusive events access"],
    cta: "Go Elite", variant: "gold" as const, popular: false, priceId: STRIPE_PRODUCTS.elite.price_id,
  },
];

const addons = [
  { name: "Profile Boost", price: "$5", desc: "Be seen by 10x more people for 30 minutes", priceId: STRIPE_ADDONS.boost.price_id },
  { name: "Super Like", price: "$2", desc: "Stand out and let them know you're serious", priceId: STRIPE_ADDONS.superLike.price_id },
  { name: "Spotlight Badge", price: "$7/week", desc: "Gold ring around your profile in discovery", priceId: STRIPE_ADDONS.spotlight.price_id },
];

const timePacks = [
  { ...STRIPE_TIME_CREDITS.thirtyMin, label: "30 Minutes", desc: "Quick burst to finish a conversation", icon: "⏱️" },
  { ...STRIPE_TIME_CREDITS.twoHours, label: "2 Hours", desc: "Keep the conversations flowing all evening", icon: "⏰" },
  { ...STRIPE_TIME_CREDITS.unlimitedDay, label: "Unlimited Today", desc: "Message as much as you want — all day, all chats", icon: "♾️" },
];

const virtualGifts = [
  { emoji: "🌹", name: "Red Rose", price: "$1" },
  { emoji: "❤️", name: "Heart", price: "$1" },
  { emoji: "🔥", name: "Flame", price: "$1" },
  { emoji: "🍫", name: "Chocolate Box", price: "$2" },
  { emoji: "🥂", name: "Champagne", price: "$2" },
  { emoji: "🎁", name: "Mystery Box", price: "$2" },
  { emoji: "💍", name: "Diamond Ring", price: "$3" },
  { emoji: "👑", name: "Gold Crown", price: "$3" },
  { emoji: "🛥️", name: "Yacht", price: "$5" },
  { emoji: "✈️", name: "Private Jet", price: "$5" },
];

const CHECKOUT_TIMEOUT_MS = 20000;

const Pricing = () => {
  const { user, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const checkoutInProgress = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    const pending = sessionStorage.getItem("pending_checkout");
    if (pending) {
      sessionStorage.removeItem("pending_checkout");
      try {
        const { priceId, mode, successUrl } = JSON.parse(pending);
        if (priceId) handleCheckout(priceId, mode, successUrl);
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const resetCheckout = () => {
    checkoutInProgress.current = false;
    setCheckoutLoading(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription", successUrl?: string) => {
    // Not logged in — save intent and send to signup
    if (!user) {
      sessionStorage.setItem("pending_checkout", JSON.stringify({ priceId, mode, successUrl }));
      toast({ title: "Create an account first", description: "Sign up or log in to purchase." });
      navigate("/signup?redirect=/pricing");
      return;
    }

    if (checkoutInProgress.current) return;
    checkoutInProgress.current = true;
    setCheckoutLoading(priceId);

    timeoutRef.current = setTimeout(() => {
      resetCheckout();
      toast({ title: "Checkout timed out", description: "Please try again.", variant: "destructive" });
    }, CHECKOUT_TIMEOUT_MS);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        resetCheckout();
        navigate("/login");
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS - 2000);

      let response: Response;
      try {
        response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": supabaseKey,
          },
          body: JSON.stringify({ priceId, mode, successUrl }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(abortTimeout);
      }

      let result: any;
      try { result = await response.json(); } catch {
        toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
        resetCheckout();
        return;
      }

      if (!response.ok) {
        toast({ title: "Checkout failed", description: result?.error || "Please try again.", variant: "destructive" });
        resetCheckout();
        return;
      }

      if (result?.url) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        window.location.href = result.url;
        return;
      }

      toast({ title: "Checkout failed", description: "No checkout URL returned.", variant: "destructive" });
      resetCheckout();
    } catch (err: any) {
      toast({ title: err?.name === "AbortError" ? "Checkout timed out" : "Checkout failed", description: "Please try again.", variant: "destructive" });
      resetCheckout();
    }
  };

  const isCurrentPlan = (planName: string) => subscriptionTier === planName.toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-heading font-bold text-gradient whitespace-nowrap">GapRomance</Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
                <Button variant="hero" size="sm" asChild><Link to="/profile">Profile</Link></Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/login">Log In</Link></Button>
                <Button variant="hero" size="sm" asChild><Link to="/signup">Join Free</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
            Find Your <span className="text-gradient">Perfect Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upgrade for unlimited connections, advanced features, and a premium dating experience.
          </p>
          {!user && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary font-medium">
              🔒 Create a free account to purchase any plan
            </div>
          )}
        </motion.div>

        <div cla
