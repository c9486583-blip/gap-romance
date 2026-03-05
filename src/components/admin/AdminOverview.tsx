import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BadgeCheck, Crown, Zap, Flag, UserPlus, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  premiumCount: number;
  eliteCount: number;
  pendingReports: number;
  newToday: number;
  newWeek: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.functions.invoke("admin-stats");
      if (data) setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading statistics...</p>;
  if (!stats) return <p className="text-muted-foreground">Failed to load statistics.</p>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Verified Users", value: stats.verifiedUsers, icon: BadgeCheck, color: "text-green-400" },
    { label: "Premium Subs", value: stats.premiumCount, icon: Zap, color: "text-yellow-400" },
    { label: "Elite Subs", value: stats.eliteCount, icon: Crown, color: "text-amber-400" },
    { label: "Pending Reports", value: stats.pendingReports, icon: Flag, color: "text-red-400" },
    { label: "New Today", value: stats.newToday, icon: UserPlus, color: "text-emerald-400" },
    { label: "New This Week", value: stats.newWeek, icon: TrendingUp, color: "text-purple-400" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-6">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-3xl font-heading font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
