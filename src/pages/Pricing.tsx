import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Sparkles,
    features: [
      "Browse profiles",
      "Limited likes per day",
      "Basic filters",
      "Create your profile",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Premium",
    price: "$39",
    period: "/month",
    icon: Zap,
    features: [
      "Everything in Free",
      "Unlimited messaging",
      "See who liked you",
      "Advanced filters",
      "Read receipts",
      "No ads",
    ],
    cta: "Go Premium",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Elite",
    price: "$69",
    period: "/month",
    icon: Crown,
    features: [
      "Everything in Premium",
      "Weekly profile boost",
      "Priority in search",
      "Spotlight badge",
      "Elite support",
      "Exclusive events access",
    ],
    cta: "Go Elite",
    variant: "gold" as const,
    popular: false,
  },
];

const addons = [
  { name: "Profile Boost", price: "$7", desc: "Be seen by 10x more people for 30 minutes" },
  { name: "Super Like", price: "$2", desc: "Stand out and let them know you're serious" },
  { name: "Spotlight Badge", price: "$12/week", desc: "Gold ring around your profile in discovery" },
  { name: "Verified Badge", price: "$15", desc: "One-time ID verification badge" },
  { name: "Virtual Gift Pack", price: "$1–5", desc: "Send roses, champagne, and more to matches" },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <Button variant="hero" size="sm" asChild>
            <Link to="/signup">Join Free</Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
            Find Your <span className="text-gradient">Perfect Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upgrade for unlimited connections, advanced features, and a premium dating experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-2xl p-8 relative hover-lift ${plan.popular ? "glow-border" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
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
              <Button variant={plan.variant} className="w-full" size="lg">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">
            À La Carte <span className="text-gradient">Extras</span>
          </h2>
          <div className="space-y-3">
            {addons.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-heading font-semibold">{a.name}</h4>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-primary">{a.price}</span>
                  <Button variant="outline" size="sm">Buy</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
