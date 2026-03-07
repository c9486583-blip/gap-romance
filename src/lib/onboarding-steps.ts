/**
 * Onboarding step constants and routing.
 * 
 * Step 0: Account created, email not verified
 * Step 1: Email verified → upload photos
 * Step 2: Photos uploaded → quiz
 * Step 3: Quiz + bio completed → profile setup
 * Step 4: Profile setup done → identity verification
 * Step 5: Verification pending
 * Step 6: Fully verified → platform access
 */

export const ONBOARDING_STEPS = {
  CREATED: 0,
  EMAIL_VERIFIED: 1,
  PHOTOS_UPLOADED: 2,
  QUIZ_COMPLETED: 3,
  PROFILE_COMPLETE: 4,
  VERIFICATION_PENDING: 5,
  FULLY_VERIFIED: 6,
} as const;

export const STEP_LABELS: Record<number, string> = {
  0: "Email Verification",
  1: "Upload Photos",
  2: "Personality Quiz",
  3: "Profile Setup",
  4: "Identity Verification",
  5: "Verification Pending",
  6: "Complete",
};

export function getOnboardingRoute(step: number): string {
  switch (step) {
    case 0: return "/signup";
    case 1: return "/upload-photos";
    case 2: return "/onboarding";
    case 3: return "/profile-setup";
    case 4: return "/verify-identity";
    case 5: return "/verification-pending";
    default: return "/discover";
  }
}

export function getStepForRoute(path: string): number | null {
  switch (path) {
    case "/upload-photos": return 1;
    case "/onboarding": return 2;
    case "/profile-preview": return 2; // sub-step of quiz
    case "/profile-setup": return 3;
    case "/verify-identity": return 4;
    case "/verification-pending": return 5;
    default: return null;
  }
}
