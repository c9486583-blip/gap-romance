import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Signup = () => {
  const [gender, setGender] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-heading font-bold text-gradient">GapRomance</Link>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First Name" className="bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              <input placeholder="Last Initial" className="bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            </div>
            <input placeholder="Email" type="email" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input placeholder="Password" type="password" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input placeholder="Phone Number" type="tel" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />

            <div>
              <label className="text-sm text-muted-foreground block mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {["Man", "Woman"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      gender === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Date of Birth</label>
              <input type="date" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
              {gender === "Woman" && <p className="text-xs text-muted-foreground mt-1">Must be 18 or older</p>}
              {gender === "Man" && <p className="text-xs text-muted-foreground mt-1">Must be 25 or older</p>}
            </div>

            <Button variant="hero" className="w-full" size="lg" asChild>
              <Link to="/onboarding">Create Account</Link>
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
