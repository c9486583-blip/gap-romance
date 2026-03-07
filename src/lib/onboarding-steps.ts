/**
 * Onboarding step constants and routing.
 *
 * Step 0: Account created, email not verified
 * Step 1: Email verified → personality quiz
 * Step 2: Quiz completed → profile setup (bio, hobbies, photos — all in one)
 * Step 3: Profile setup done → identity verification
 * Step 4: Verification pending
 * Step 5: Fully verified → platform access
 *
 * NOTE: Photos cannot be uploaded until AFTER the quiz (step 1 → step 2).
 * The old /upload-photos route is no longer part of the flow.
 */

export const ONBOARDING_STEPS = {
  CREATED: 0,
  EMAIL_VERIFIED: 1,
  QUIZ_COMPLETED: 2,
  PROFILE_COMPLETE: 3,
  VERIFICATION_PENDING: 4,
  FULLY_VERIFIED: 5,
} as const;

export const STEP_LABELS: Record<number, string> = {
  0: "Email Verification",
  1: "Personality Quiz",
  2: "Profile Setup",
  3: "Identity Verification",
  4: "Verification Pending",
  5: "Complete",
};

export function getOnboardingRoute(step: number): string {
  switch (step) {
    case 0: return "/signup";
    case 1: return "/onboarding";
    case 2: return "/profile-setup";
    case 3: return "/verify-identity";
    case 4: return "/verification-pending";
    default: return "/discover";
  }
}

export function getStepForRoute(path: string): number | null {
  switch (path) {
    case "/onboarding":           return 1;
    case "/profile-setup":        return 2;
    case "/verify-identity":      return 3;
    case "/verification-pending": return 4;
    default: return null;
  }
}
