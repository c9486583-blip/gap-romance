import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavProps {
  rightContent?: React.ReactNode;
}

const TopNav = ({ rightContent }: TopNavProps) => {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            alt="GapRomance logo"
            className="h-8 w-auto object-contain border-0 rounded-none"
            src="/lovable-uploads/35979146-566e-4b78-97a6-4d67f2473574.png"
          />
          <span className="text-xl font-heading font-bold text-gradient whitespace-nowrap">
            GapRomance
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {rightContent}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
