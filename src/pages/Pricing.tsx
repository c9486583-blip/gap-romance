import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRODUCTS, STRIPE_ADDONS } from "@/lib/stripe-products";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free", price: "$0", period: "forever", icon: Sparkles,
    features: ["Browse profiles", "Limited likes per day", "Basic filters", "Create your profile"],
    cta: "Get Started", variant: "outline" as const, popular: false, priceId: null,
  },
  {
    name: "Premium", price: "$39", period: "/month", icon: Zap,
    features: ["Everything in Free", "Unlimited messaging", "See who liked you", "Advanced filters", "Read receipts", "No ads"],
    cta: "Go Premium", variant: "hero" as const, popular: true, priceId: STRIPE_PRODUCTS.premium.price_id,
  },
  {
    name: "Elite", price: "$69", period: "/month", icon: Crown,
    features: ["Everything in Premium", "Weekly profile boost", "Priority in search", "Spotlight badge", "Elite support", "Exclusive events access"],
    cta: "Go Elite", variant: "gold" as const, popular: false, priceId: STRIPE_PRODUCTS.elite.price_id,
  },
];

const addons = [
  { name: "Profile Boost", price: "$7", desc: "Be seen by 10x more people for 30 minutes", priceId: STRIPE_ADDONS.boost.price_id },
  { name: "Super Like", price: "$2", desc: "Stand out and let them know you're serious", priceId: STRIPE_ADDONS.superLike.price_id },
  { name: "Spotlight Badge", price: "$12/week", desc: "Gold ring around your profile in discovery", priceId: STRIPE_ADDONS.spotlight.price_id },
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

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription") => {
    if (!user) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, mode },
    });
    if (error || !data?.url) {
      toast({ title: "Checkout failed", description: error?.message || "Please try again", variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank");
  };

  const isCurrentPlan = (planName: string) => subscriptionTier === planName.toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <Button variant="hero" size="sm" asChild>
            <Link to={user ? "/discover" : "/signup"}>{user ? "Discover" : "Join Free"}</Link>
          </Button>
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
                <Button variant={plan.variant} className="w-full" size="lg" onClick={() => handleCheckout(plan.priceId!)}>
                  {plan.cta}
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
                  <Button variant="outline" size="sm" onClick={() => handleCheckout(a.priceId, "payment")}>Buy</Button>
                </div>
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
            <p className="text-muted-foreground text-sm mb-4">Identity verification is <span className="text-primary font-bold">free</span> for all users. Verify with a selfie or government ID to earn your Verified badge.</p>
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
