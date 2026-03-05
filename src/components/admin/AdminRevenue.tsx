import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

interface RevenueData {
  totalThisMonth: number;
  productBreakdown: Record<string, { count: number; mrr: number }>;
  revenueOverTime: { month: string; amount: number }[];
  activeSubscriptions: number;
}

const AdminRevenue = () => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: result, error: err } = await supabase.functions.invoke("admin-revenue");
      if (err) setError("Failed to load revenue data");
      else if (result) setData(result);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading revenue data...</p>;
  if (error || !data) return <p className="text-muted-foreground">{error || "Failed to load revenue data."}</p>;

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-6">Revenue Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-xs text-muted-foreground">Revenue This Month</span>
          </div>
          <p className="text-3xl font-heading font-bold">${data.totalThisMonth.toFixed(2)}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-muted-foreground">Active Subscriptions</span>
          </div>
          <p className="text-3xl font-heading font-bold">{data.activeSubscriptions}</p>
        </div>
      </div>

      {Object.keys(data.productBreakdown).length > 0 && (
        <div className="glass rounded-xl p-5 mb-8">
          <h3 className="text-lg font-heading font-bold mb-4">Revenue by Product</h3>
          <div className="space-y-3">
            {Object.entries(data.productBreakdown).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                <div className="text-right">
                  <span className="text-sm font-bold">${info.mrr.toFixed(2)}/mo</span>
                  <span className="text-xs text-muted-foreground ml-2">({info.count} active)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.revenueOverTime.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="text-lg font-heading font-bold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AdminRevenue;
