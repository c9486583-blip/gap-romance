import { Compass, Heart, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/matches", label: "Matches", icon: Heart },
  { path: "/messages", label: "Messages", icon: MessageCircle },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Hide on admin page
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
