import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

const STEP_NAMES = [
  "Account",
  "Email Verification",
  "Upload Photos",
  "Personality Quiz",
  "Profile Setup",
  "Identity Verification",
  "Complete",
];

const OnboardingProgress = ({ currentStep, totalSteps, stepLabel }: OnboardingProgressProps) => {
  const progress = (currentStep / totalSteps) * 100;

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
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i + 1 <= currentStep ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;
