import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect } from "react";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { location, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, []);

  const handleSignup = async () => {
    if (!agreedToTerms) {
      toast({ title: "You must agree to the Terms of Service", variant: "destructive" });
      return;
    }
    if (!gender) {
      toast({ title: "Please select your gender", variant: "destructive" });
      return;
    }
    if (!dob) {
      toast({ title: "Please enter your date of birth", variant: "destructive" });
      return;
    }

    // Age validation
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    const minAge = gender === "Man" ? 25 : 18;
    if (age < minAge) {
      toast({ title: `You must be at least ${minAge} years old`, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update profile with signup data
    if (data.user) {
      const updateData: any = {
        first_name: firstName,
        last_initial: lastInitial,
        phone,
        gender,
        date_of_birth: dob,
      };
      if (location) {
        updateData.latitude = location.lat;
        updateData.longitude = location.lng;
        updateData.city = location.city;
      }
      
      await supabase.from("profiles").update(updateData).eq("user_id", data.user.id);
    }

    setLoading(false);
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-heading font-bold text-gradient">GapRomance</Link>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>
        <div className="glass rounded-2xl p-8">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className="bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              <input value={lastInitial} onChange={(e) => setLastInitial(e.target.value)} placeholder="Last Initial" className="bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            </div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" type="tel" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <div>
              <label className="text-sm text-muted-foreground block mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {["Man", "Woman"].map((g) => (
                  <button key={g} onClick={() => setGender(g)} className={`py-3 rounded-xl border text-sm font-bold transition-all ${gender === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
              {gender === "Woman" && <p className="text-xs text-muted-foreground mt-1">Must be 18 or older</p>}
              {gender === "Man" && <p className="text-xs text-muted-foreground mt-1">Must be 25 or older</p>}
            </div>
            <div className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 accent-primary"
                id="terms-checkbox"
              />
              <label htmlFor="terms-checkbox" className="text-sm text-muted-foreground">
                I have read and agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline" target="_blank">Terms of Service & User Agreement</Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.
              </label>
            </div>
            <Button variant="hero" className="w-full" size="lg" onClick={handleSignup} disabled={loading || !agreedToTerms}>
              {loading ? "Creating Account..." : "Create Account"}
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
