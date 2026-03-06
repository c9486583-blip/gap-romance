import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const ProtectedRoute = ({ children, requireVerified = true }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

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

  if (requireVerified && profile && !profile.is_verified) {
    const dest = profile.verification_status === "not_started" ? "/verify-identity" : "/verification-pending";
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
