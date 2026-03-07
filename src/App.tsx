import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotificationPrompt from "@/components/NotificationPrompt";
import BottomNav from "@/components/BottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OnboardingQuiz from "./pages/OnboardingQuiz";
import IdentityVerification from "./pages/IdentityVerification";
import VerificationPending from "./pages/VerificationPending";
import ProfilePreview from "./pages/ProfilePreview";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Safety from "./pages/Safety";
import CreditSuccess from "./pages/CreditSuccess";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import PhotoUpload from "./pages/PhotoUpload";

const queryClient = new QueryClient();

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/discover" replace />;
  return <Landing />;
};

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/discover" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationPrompt />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload-photos" element={<ProtectedRoute requireVerified={false}><PhotoUpload /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute requireVerified={false}><OnboardingQuiz /></ProtectedRoute>} />
            <Route path="/profile-preview" element={<ProtectedRoute requireVerified={false}><ProfilePreview /></ProtectedRoute>} />
            <Route path="/profile-setup" element={<ProtectedRoute requireVerified={false}><ProfileSetup /></ProtectedRoute>} />
            <Route path="/verify-identity" element={<ProtectedRoute requireVerified={false}><IdentityVerification /></ProtectedRoute>} />
            <Route path="/verification-pending" element={<ProtectedRoute requireVerified={false}><VerificationPending /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/credit-success" element={<ProtectedRoute><CreditSuccess /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
