import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingRoute, getStepForRoute, ONBOARDING_STEPS } from "@/lib/onboarding-steps";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const ProtectedRoute = ({ children, requireVerified = true }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const step = profile?.onboarding_step ?? 0;

  if (requireVerified) {
    if (step < ONBOARDING_STEPS.FULLY_VERIFIED) {
      return <Navigate to={getOnboardingRoute(step)} replace />;
    }
    return <>{children}</>;
  }

  const requiredStep = getStepForRoute(location.pathname);

  if (requiredStep !== null) {
    if (step < requiredStep) {
      return <Navigate to={getOnboardingRoute(step)} replace />;
    }
    if (step > requiredStep && location.pathname !== "/profile-preview") {
      return <Navigate to={getOnboardingRoute(step)} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
