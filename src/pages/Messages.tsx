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
        toast({ title: "Failed to
