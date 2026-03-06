import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Phone, ArrowLeft, Loader2, MapPinOff } from "lucide-react";
import PasswordStrengthIndicator, { isPasswordStrong, getPasswordRequirements } from "@/components/PasswordStrengthIndicator";

const Signup = () => {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToSafety, setAgreedToSafety] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [testCode, setTestCode] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { location, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isOutsideUS = location && location.countryCode && location.countryCode !== "US";

  const validateForm = (): boolean => {
    if (isOutsideUS) {
      toast({ title: "GapRomance is currently only available in the United States.", variant: "destructive" });
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
    if (!phone || phone.length < 10) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
      return false;
    }
    if (!firstName.trim()) {
      toast({ title: "Please enter your first name", variant: "destructive" });
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

  const sendOtp = async () => {
    setOtpSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone },
      });
      if (error || !data?.success) {
        toast({ title: "Failed to send code", description: error?.message || data?.error, variant: "destructive" });
        setOtpSending(false);
        return false;
      }
      // For testing: store the code (remove in production)
      if (data._test_code) setTestCode(data._test_code);
      setResendCooldown(60);
      toast({ title: "Code sent!", description: `A 6-digit code was sent to ${phone}` });
      setOtpSending(false);
      return true;
    } catch {
      toast({ title: "Failed to send code", variant: "destructive" });
      setOtpSending(false);
      return false;
    }
  };

  const handleSendVerification = async () => {
    if (!validateForm()) return;
    const sent = await sendOtp();
    if (sent) setStep("verify");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpCode(pasted.split(""));
    }
  };

  const handleVerifyAndSignup = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      toast({ title: "Please enter the full 6-digit code", variant: "destructive" });
      return;
    }

    setOtpVerifying(true);

    // Verify OTP
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-phone-otp", {
      body: { phone, code },
    });

    if (verifyError || !verifyData?.verified) {
      toast({
        title: "Verification failed",
        description: verifyData?.error || "Invalid or expired code",
        variant: "destructive",
      });
      setOtpVerifying(false);
      return;
    }

    // Phone verified — now create the account
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      setOtpVerifying(false);
      return;
    }

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
    setOtpVerifying(false);
    navigate("/onboarding");
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpCode(["", "", "", "", "", ""]);
    await sendOtp();
  };

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-heading font-bold text-gradient">GapRomance</Link>
          <p className="text-muted-foreground mt-2">
            {step === "form" ? "Create your account" : "Verify your phone number"}
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* US-only geo block */}
          {isOutsideUS && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
              <MapPinOff className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive font-bold">GapRomance is currently only available in the United States.</p>
              <p className="text-xs text-muted-foreground mt-1">We hope to expand to more countries soon.</p>
            </div>
          )}
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className={inputClass} />
                    <input value={lastInitial} onChange={(e) => setLastInitial(e.target.value)} placeholder="Last Initial" className={inputClass} />
                  </div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={inputClass} />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className={inputClass} />
                  <PasswordStrengthIndicator password={password} />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      type="tel"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
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

                  {/* Checkboxes */}
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
                    onClick={handleSendVerification}
                    disabled={otpSending || !agreedToTerms || !agreedToPrivacy || !agreedToSafety || !!isOutsideUS}
                  >
                    {otpSending ? (
                      <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Sending Code...</>
                    ) : (
                      "Verify Phone & Create Account"
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="space-y-6">
                  <button onClick={() => { setStep("form"); setOtpCode(["", "", "", "", "", ""]); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to form
                  </button>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-1">Enter verification code</h3>
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to <span className="text-foreground font-medium">{phone}</span>
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-bold bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    ))}
                  </div>

                  {/* Test code hint (remove in production) */}
                  {testCode && (
                    <p className="text-xs text-center text-muted-foreground">
                      Test code: <span className="text-primary font-mono font-bold">{testCode}</span>
                    </p>
                  )}

                  <Button
                    variant="hero"
                    className="w-full"
                    size="lg"
                    onClick={handleVerifyAndSignup}
                    disabled={otpVerifying || loading || otpCode.join("").length !== 6}
                  >
                    {otpVerifying || loading ? (
                      <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Verifying...</>
                    ) : (
                      "Verify & Create Account"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Didn't receive the code?</p>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className={`text-sm font-medium transition-colors ${
                        resendCooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"
                      }`}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
