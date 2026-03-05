import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminReports from "@/components/admin/AdminReports";
import AdminModeration from "@/components/admin/AdminModeration";
import AdminRevenue from "@/components/admin/AdminRevenue";
import AdminVerification from "@/components/admin/AdminVerification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Shield, BarChart3, Users, Flag, MessageSquareWarning, DollarSign, BadgeCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  if (!user || isAdmin === false) return <AdminLogin onSuccess={() => setIsAdmin(true)} />;
  if (isAdmin === null) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="users" className="gap-1"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1"><Flag className="w-3.5 h-3.5" />Reports</TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1"><MessageSquareWarning className="w-3.5 h-3.5" />Moderation</TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1"><DollarSign className="w-3.5 h-3.5" />Revenue</TabsTrigger>
            <TabsTrigger value="verification" className="gap-1"><BadgeCheck className="w-3.5 h-3.5" />Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="reports"><AdminReports /></TabsContent>
          <TabsContent value="moderation"><AdminModeration /></TabsContent>
          <TabsContent value="revenue"><AdminRevenue /></TabsContent>
          <TabsContent value="verification"><AdminVerification /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
