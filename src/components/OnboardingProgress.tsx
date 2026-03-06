import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Camera, Brain, FileText, Sparkles, Shield, MessageSquare } from "lucide-react";

// Steps configuration
const ONBOARDING_STEPS = [
  { id: "photos", label: "Photos", icon: Camera, path: "/upload-photos" },
  { id: "quiz", label: "Personality Quiz", icon: Brain, path: "/onboarding" },
  { id: "bio", label: "Review Bio", icon: FileText, path: "/profile-preview" },
  { id: "badges", label: "Badges & Tags", icon: Sparkles, path: "/onboarding" }, // handled within quiz
  { id: "verify", label: "Verify Identity", icon: Shield, path: "/verify-identity" },
  { id: "note", label: "Today's Note", icon: MessageSquare, path: "/onboarding" }, // optional last step
];

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

const OnboardingProgress = ({ currentStep, totalSteps, stepLabel }: OnboardingProgressProps) => {
  const progress = ((currentStep) / totalSteps) * 100;
  
  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-bold">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-primary font-bold">{stepLabel}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
};

export default OnboardingProgress;
export { ONBOARDING_STEPS };
