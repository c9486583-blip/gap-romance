import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, Users, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const features = [
  { icon: Heart, title: "Two Dating Modes", desc: "Choose Serious or Casual dating — or both. Your call." },
  { icon: Sparkles, title: "AI-Powered Matching", desc: "Our quiz learns your vibe and finds your perfect match from day one." },
  { icon: Shield, title: "Verified Profiles", desc: "Photo & ID verification for a safer, more authentic experience." },
  { icon: Users, title: "Your Age, Your Rules", desc: "Search any age range you want. No forced defaults." },
];

const stats = [
  { value: "500K+", label: "Active Members" },
  { value: "89%", label: "Match Rate" },
  { value: "4.8★", label: "App Rating" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/signup">Join Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#111111]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(330_100%_44%/0.12)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_bottom,hsl(330_100%_44%/0.08)_0%,transparent_70%)]" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-primary font-body font-bold tracking-[0.3em] uppercase text-sm mb-6">
              Premium Age-Gap Dating
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 leading-tight">
              Built for Those<br />
              <span className="text-gradient">Who Know What They Want</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
              The exclusive dating platform for meaningful connections across age gaps.
              AI-matched. Verified. Unforgettable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-lg px-10 py-6" asChild>
                <Link to="/signup">
                  Get Started <ChevronRight className="ml-1" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" className="text-lg px-10 py-6" asChild>
                <Link to="/pricing">View Plans</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 flex justify-center gap-12 md:gap-20"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-gradient">{s.value}</div>
                <div className="text-muted-foreground text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Why <span className="text-gradient">GapRomance</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for real connections, powered by intelligence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 hover-lift group cursor-default"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass rounded-2xl p-12 md:p-16 text-center glow-border">
            <Star className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              Ready to Find Your Match?
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
              Join thousands of members who've already found their perfect connection.
            </p>
            <Button variant="hero" size="lg" className="text-lg px-12 py-6" asChild>
              <Link to="/signup">Create Your Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
