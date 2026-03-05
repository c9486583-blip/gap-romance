import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const subjectOptions = [
  "General Inquiry",
  "Report a User",
  "Billing & Subscriptions",
  "Technical Support",
  "Safety Concern",
];

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Message sent!", description: "We'll get back to you within 2 business days." });
      setName(""); setEmail(""); setSubject(""); setMessage("");
      setLoading(false);
    }, 1000);
  };

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Log In</Link></Button>
            <Button variant="hero" size="sm" asChild><Link to="/signup">Join Free</Link></Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-center">
              Contact <span className="text-gradient">Us</span>
            </h1>
            <p className="text-muted-foreground text-center mb-10">
              Have a question or concern? We're here to help.
            </p>

            <div className="glass rounded-2xl p-8 mb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
                    <option value="" disabled>Select a subject</option>
                    {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's on your mind..." rows={5} className={inputClass + " resize-none"} />
                </div>
                <Button variant="hero" className="w-full" size="lg" type="submit" disabled={loading}>
                  {loading ? "Sending..." : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                </Button>
              </form>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-1">You can also reach us directly at</p>
              <a href="mailto:support@gapromance.com" className="text-primary font-semibold hover:underline">
                support@gapromance.com
              </a>
              <p className="text-muted-foreground text-xs mt-2">We aim to respond within 2 business days.</p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
