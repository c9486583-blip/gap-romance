import { Link, useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, User, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const { user, profile } = useAuth();
  const location = useLocation();

  // Only show after fully logged in and onboarded
  if (!user || !profile) return null;
  if ((profile.onboarding_step ?? 0) < 5) return null;

  const links = [
    { to: "/discover", icon: Home, label: "Discover" },
    { to: "/matches", icon: Heart, label: "Matches" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
      <div className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
