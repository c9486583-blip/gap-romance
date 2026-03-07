import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Loader2, CheckCircle, MapPinOff, AtSign } from "lucide-react";
import PasswordStrengthIndicator, { isPasswordStrong, getPasswordRequirements } from "@/components/PasswordStrengthIndicator";
import { getOnboardingRoute } from "@/lib/onboarding-steps";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToSafety, setAgreedToSafety] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { location, requestLocation } = useGeolocation();
  const { user, profile } = useAuth();

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (user && profile) {
      const step = profile.onboarding_step ?? 0;
      if (step >= 1) {
        navigate(getOnboardingRoute(step), { replace: true });
      }
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/\s/g, "");
    setUsername(cleaned);
    setUsernameTaken(false);
    setUsernameError("");

    if (cleaned.length === 0) return;
    if (cleaned.length < 4) {
      setUsernameError("Username must be at least 4 characters.");
      return;
    }
    if (cleaned.length > 15) {
      setUsernameError("Username must be 15 characters or less.");
      return;
    }

    // Debounce the uniqueness check
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    setUsernameChecking(true);
    usernameCheckRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", cleaned)
        .maybeSingle();
      if (data) {
        setUsernameTaken(true);
        setUsernameError("This username is already taken. Please choose another.");
      } else {
        setUsernameTaken(false);
        setUsernameError("");
      }
      setUsernameChecking(false);
    }, 600);
  };

  const isOutsideUS = location && location.countryCode && location.countryCode !== "US";

  const validateForm = (): boolean => {
    if (isOutsideUS) {
      toast({ title: "GapRomance is currently only available in the United States.", variant: "destructive" });
      return false;
    }
    if (!firstName.trim()) {
      toast({ title: "Please enter your first name", variant: "destructive" });
      return false;
    }
    if (!username.trim()) {
      toast({ title: "Please choose a username", variant: "destructive" });
      return false;
    }
    if (username.length < 4) {
      toast({ title: "Username must be at least 4 characters", variant: "destructive" });
      return false;
    }
    if (username.length > 15) {
      toast({ title: "Username must be 15 characters or less", variant: "destructive" });
      return false;
    }
    if (usernameTaken) {
      toast({ title: "That username is already taken", description: "Please choose a different username.", variant: "destructive" });
      return false;
    }
    if (usernameChecking) {
      toast({ title: "Please wait while we check your username", variant: "destructive" });
      return false;
    }
    if (!agreedToTerms || !agreedToPrivacy || !agreedToSafety) {
      toast({ title: "You must agree to all required policies", variant: "destructive" });
      return false;
    }
    if (!gender) {
      toast({ title: "Please select your gender", variant: "destructive" });
      return false;
    }
    if (!dob) {
      toast({ title: "Please enter your date of birth", variant: "destructive" });
      return false;
    }
    if (!email.trim() || !password) {
      toast({ title: "Please fill in email and password", variant: "destructive" });
      return false;
    }
    if (!isPasswordStrong(password)) {
      const req = getPasswordRequirements(password);
      const missing: string[] = [];
      if (!req.minLength) missing.push("at least 8 characters");
      if (!req.hasUppercase) missing.push("one uppercase letter");
      if (!req.hasLowercase) missing.push("one lowercase letter");
      if (!req.hasNumber) missing.push("one number");
      if (!req.hasSpecial) missing.push("one special character (!@#$%&)");
      toast({ title: "Password too weak", description: `Missing: ${missing.join(", ")}`, variant: "destructive" });
      return false;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    const minAge = gender === "Man" ? 25 : 18;
    if (age < minAge) {
      toast({ title: `You must be at least ${minAge} years old`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Final username check right before account creation
      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      if (existingUsername) {
        toast({ title: "That username was just taken", description: "Please choose a different username.", variant: "destructive" });
        setUsernameTaken(true);
        setUsernameError("This username is already taken. Please choose another.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });

      if (error) {
        // Check if account already exists
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
          toast({ title: "An account with this email already exists.", description: "Please log in instead.", variant: "destructive" });
        } else {
          toast({ title: "Signup failed", description: error.message, variant: "destructive" });
        }
        return;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast({ title: "An account with this email already exists.", description: "Please log in instead.", variant: "destructive" });
        return;
      }

      if (data.user) {
        // Wait for DB trigger to create profile row
        await new Promise((res) => setTimeout(res, 800));
        const upsertData: any = {
          user_id: data.user.id,
          first_name: firstName,
          last_initial: lastInitial,
          username,
          gender,
          date_of_birth: dob,
          onboarding_step: 0,
          email,
        };
        if (location) {
          upsertData.latitude = location.lat;
          upsertData.longitude = location.lng;
          upsertData.city = location.city;
        }
        await supabase.from("profiles").upsert(upsertData);
      }

      setEmailSent(true);
      startCooldown();
      toast({ title: "Verification email sent!", description: `Check your inbox at ${email}` });
    } catch (err: any) {
      console.error("Signup error:", err);
      toast({ title: "Something went wrong", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Email resent!", description: `Check your inbox at ${email}` });
        startCooldown();
      }
    } catch (err: any) {
      toast({ title: "Failed to resend", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-heading font-bold text-gradient">GapRomance</Link>
          <p className="text-muted-foreground mt-2">
            {emailSent ? "Verify your email to continue" : "Create your account"}
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {isOutsideUS && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
              <MapPinOff className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive font-bold">GapRomance is currently only available in the United States.</p>
              <p className="text-xs text-muted-foreground mt-1">We are US-based only at this time.</p>
            </div>
          )}

          {emailSent ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold mb-2">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a verification link to <span className="text-foreground font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the <strong>Verify</strong> button in the email to activate your account and continue.
                </p>
                <p className="text-xs text-muted-foreground mt-3">Check your spam folder if you don't see it.</p>
              </div>

              <div className="flex items-center gap-2 justify-center p-3 rounded-xl bg-primary/5 border border-primary/20">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">You'll be redirected automatically once verified</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Didn't receive it?</p>
                <button
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className={`text-sm font-medium transition-colors ${loading || resendCooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"}`}
                >
                  {loading ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className={inputClass} />
                <input value={lastInitial} onChange={(e) => setLastInitial(e.target.value)} placeholder="Last Initial" className={inputClass} />
              </div>

              {/* Username field */}
              <div>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Username (e.g. chrisvibes)"
                    maxLength={15}
                    className={`${inputClass} pl-9 ${usernameError ? "border-destructive" : username.length >= 4 && !usernameTaken && !usernameChecking ? "border-green-500" : ""}`}
                  />
                  {usernameChecking && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!usernameChecking && username.length >= 4 && !usernameTaken && !usernameError && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
                {!usernameError && <p className="text-xs text-muted-foreground mt-1">4–15 characters. This is how others will find you — make it creative!</p>}
              </div>

              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={inputClass} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className={inputClass} />
              <PasswordStrengthIndicator password={password} />

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
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
                {gender === "Woman" && <p className="text-xs text-muted-foreground mt-1">Must be 18 or older</p>}
                {gender === "Man" && <p className="text-xs text-muted-foreground mt-1">Must be 25 or older</p>}
              </div>

              <div className="flex items-start gap-3 mt-2">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 accent-primary" id="terms-checkbox" />
                <label htmlFor="terms-checkbox" className="text-sm text-muted-foreground">
                  I have read and agree to the <Link to="/terms" className="text-primary hover:underline" target="_blank">Terms of Service</Link>.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={agreedToPrivacy} onChange={(e) => setAgreedToPrivacy(e.target.checked)} className="mt-1 accent-primary" id="privacy-checkbox" />
                <label htmlFor="privacy-checkbox" className="text-sm text-muted-foreground">
                  I have read and agree to the <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={agreedToSafety} onChange={(e) => setAgreedToSafety(e.target.checked)} className="mt-1 accent-primary" id="safety-checkbox" />
                <label htmlFor="safety-checkbox" className="text-sm text-muted-foreground">
                  I have read and agree to the <Link to="/safety" className="text-primary hover:underline" target="_blank">Safety Guidelines</Link>.
                </label>
              </div>

              <Button
                variant="hero"
                className="w-full"
                size="lg"
                onClick={handleSignup}
                disabled={loading || !agreedToTerms || !agreedToPrivacy || !agreedToSafety || !!isOutsideUS || usernameTaken || usernameChecking}
              >
                {loading ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating Account...</>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          )}

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
