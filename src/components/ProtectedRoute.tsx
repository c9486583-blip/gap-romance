import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingRoute, getStepForRoute, ONBOARDING_STEPS } from "@/lib/onboarding-steps";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const ProtectedRoute = ({ children, requireVerified = true }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const step = profile?.onboarding_step ?? 0;

  // Platform pages: require full onboarding completion
  if (requireVerified) {
    if (step < ONBOARDING_STEPS.FULLY_VERIFIED) {
      return <Navigate to={getOnboardingRoute(step)} replace />;
    }
    return <>{children}</>;
  }

  // Onboarding pages: enforce sequential step access
  const requiredStep = getStepForRoute(location.pathname);

  if (requiredStep !== null) {
    // User hasn't reached this step yet → send to their current step
    if (step < requiredStep) {
      return <Navigate to={getOnboardingRoute(step)} replace />;
    }
    // User already completed this step → send forward (except profile-preview which is sub-step of quiz)
    if (step > requiredStep && location.pathname !== "/profile-preview") {
      return <Navigate to={getOnboardingRoute(step)} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
