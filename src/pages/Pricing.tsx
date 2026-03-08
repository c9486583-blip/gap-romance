import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRODUCTS, STRIPE_ADDONS, STRIPE_TIME_CREDITS } from "@/lib/stripe-products";
import { useToast } from "@/hooks/use-toast";
import TopNav from "@/components/TopNav";

const plans = [
  {
    name: "Free", price: "$0", period: "forever", icon: Sparkles,
    features: ["Browse profiles","Limited likes per day","Basic filters","1 hour messaging time/day"],
    cta: "Get Started", variant: "outline" as const, popular: false, priceId: null,
  },
  {
    name: "Premium", price: "$19.99", period: "/month", icon: Zap,
    features: ["Everything in Free","Unlimited messaging time","See who liked you","Advanced filters","Read receipts","No ads"],
    cta: "Go Premium", variant: "hero" as const, popular: true, priceId: STRIPE_PRODUCTS.premium.price_id,
  },
  {
    name: "Elite", price: "$34.99", period: "/month", icon: Crown,
    features: ["Everything in Premium","Weekly profile boost","Priority in search","Spotlight badge","Elite support","Exclusive events access"],
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

const Pricing = () => {
  const { user, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const checkoutInProgress = useRef(false);

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription", successUrl?: string) => {
    if (!user) {
      sessionStorage.setItem("pending_checkout", JSON.stringify({ priceId, mode, successUrl }));
      navigate("/signup?redirect=/pricing");
      return;
    }

    if (checkoutInProgress.current) return;
    checkoutInProgress.current = true;
    setCheckoutLoading(priceId);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast({ title: "Please log in again", description: "Your session has expired.", variant: "destructive" });
        checkoutInProgress.current = false;
        setCheckoutLoading(null);
        return;
      }

      // FIX #2: Add 10-second timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ priceId, mode, successUrl }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        const result = await response.json();

        if (!response.ok) {
          toast({ title: "Checkout failed", description: result?.error || "Unknown error", variant: "destructive" });
          return;
        }

        if (result?.url) {
          window.location.href = result.url;
          return;
        } else {
          toast({ title: "Checkout failed", description: "No checkout URL returned", variant: "destructive" });
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          toast({ title: "Checkout failed", description: "Request timeout. Please try again.", variant: "destructive" });
        } else {
          throw fetchErr;
        }
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      checkoutInProgress.current = false;
      setCheckoutLoading(null);
    }
  };

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

  const isCurrentPlan = (planName: string) => subscriptionTier === planName.toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      {/* FIX #1: Use TopNav component instead of custom nav */}
      <TopNav rightContent={
        user ? (
          <>
            <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
            <Button variant="hero" size="sm" asChild><Link to="/profile">Profile</Link></Button>
          </>
        ) : (
          <Button variant="hero" size="sm" asChild><Link to="/signup">Join Free</Link></Button>
        )
      } />

      <div className="container mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
            Find Your <span className="text-gradient">Perfect Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upgrade for unlimited connections, advanced features, and a premium dating experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`glass rounded-2xl p-8 relative hover-lift ${plan.popular ? "glow-border" : ""} ${isCurrentPlan(plan.name) ? "ring-2 ring-primary" : ""}`}>
              {isCurrentPlan(plan.name) && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">YOUR PLAN</span>
                </div>
              )}
              {plan.popular && !isCurrentPlan(plan.name) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
                </div>
              )}
              <div className="text-center mb-6">
                <plan.icon className={`w-8 h-8 mx-auto mb-3 ${plan.popular ? "text-primary" : plan.name === "Elite" ? "text-gold" : "text-muted-foreground"}`} />
                <h3 className="font-heading text-2xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-heading font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan(plan.name) ? (
                <Button variant="outline" className="w-full" size="lg" disabled>Current Plan</Button>
              ) : plan.priceId ? (
                <Button variant={plan.variant} className="w-full" size="lg"
                  onClick={() => handleCheckout(plan.priceId!)}
                  disabled={checkoutLoading === plan.priceId}>
                  {checkoutLoading === plan.priceId ? "Loading..." : plan.cta}
                </Button>
              ) : (
                <Button variant={plan.variant} className="w-full" size="lg" asChild>
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">
            À La Carte <span className="text-gradient">Extras</span>
          </h2>
          <div className="space-y-3">
            {addons.map((a, i) => (
              <motion.div key={a.name} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-semibold">{a.name}</h4>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-primary">{a.price}</span>
                  <Button variant="outline" size="sm"
                    onClick={() => handleCheckout(a.priceId, "payment")}
                    disabled={checkoutLoading === a.priceId}>
                    {checkoutLoading === a.priceId ? "..." : "Buy"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-3">
            Messaging Time <span className="text-gradient">Credits</span>
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Free users get 1 hour of active messaging time per day. Need more? Buy extra time — no subscription required.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {timePacks.map((pack, i) => (
              <motion.div key={pack.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 text-center hover-lift">
                <div className="text-4xl mb-2">{pack.icon}</div>
                <div className="text-xl font-heading font-bold mb-1">{pack.label}</div>
                <div className="text-2xl font-heading font-bold text-primary mb-2">${pack.price.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mb-4">{pack.desc}</p>
                <Button variant="outline" className="w-full"
                  onClick={() => handleCheckout(pack.price_id, "payment", "/payment-success")}
                  disabled={checkoutLoading === pack.price_id}>
                  {checkoutLoading === pack.price_id ? "Loading..." : "Buy Time"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-3">
            Virtual <span className="text-gradient">Gifts</span>
          </h2>
          <p className="text-muted-foreground text-center mb-8">Send fun animated gifts to your matches inside chat</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {virtualGifts.map((g) => (
              <motion.div key={g.name} whileHover={{ scale: 1.15 }} className="flex flex-col items-center gap-1 p-3 glass rounded-xl">
                <span className="text-3xl">{g.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{g.name}</span>
                <span className="text-xs font-bold text-primary">{g.price}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-16 mb-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="glass rounded-2xl p-8 text-center glow-border">
            <Shield className="w-8 h-8 mx-auto mb-3 text-primary" />
            <h3 className="font-heading text-xl font-bold mb-2">Verified Badge</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Identity verification is <span className="text-primary font-bold">free</span> for all users. Verify with a government ID to earn your Verified badge.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">Get Verified Free</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
