import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, Ban, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  context: string | null;
  message_id: string | null;
  source: string;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchReports = async () => {
      setLoading(true);
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data } = await query;
      if (!data) { setReports([]); setLoading(false); return; }

      // Fetch reporter/reported names
      const userIds = [...new Set(data.flatMap((r: any) => [r.reporter_id, r.reported_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_initial")
        .in("user_id", userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, `${p.first_name || "User"} ${p.last_initial || ""}`.trim()]));

      setReports(data.map((r: any) => ({
        ...r,
        reporter_name: nameMap.get(r.reporter_id) || "Unknown",
        reported_name: nameMap.get(r.reported_id) || "Unknown",
      })));
      setLoading(false);
    };
    fetchReports();
  }, [isAdmin, filter]);

  const updateStatus = async (reportId: string, status: string) => {
    await supabase.from("reports").update({ status } as any).eq("id", reportId);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    toast({ title: `Report marked as ${status}` });
  };

  if (isAdmin === null) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
        <Button variant="hero" asChild><Link to="/">Go Home</Link></Button>
      </div>
    </div>
  );

  const statusIcon = (s: string) => {
    if (s === "pending") return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    if (s === "reviewed") return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (s === "warned") return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
    if (s === "suspended" || s === "banned") return <Ban className="w-3.5 h-3.5 text-destructive" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Admin</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-heading font-bold mb-6">Report Dashboard</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["pending", "reviewed", "warned", "suspended", "banned", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
                filter === s ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-muted-foreground">No reports found.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(r.status)}
                      <span className="text-sm font-bold capitalize">{r.status}</span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{r.source}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mb-1">
                      <span className="text-muted-foreground">Reporter:</span> <span className="font-medium">{r.reporter_name}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">Reported:</span> <span className="font-medium">{r.reported_name}</span>
                    </p>
                    <p className="text-sm"><span className="text-muted-foreground">Reason:</span> <span className="font-bold text-destructive">{r.reason}</span></p>
                    {r.context && <p className="text-sm text-muted-foreground mt-1">"{r.context}"</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "reviewed")}>Dismiss</Button>
                        <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/30" onClick={() => updateStatus(r.id, "warned")}>Warn</Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => updateStatus(r.id, "suspended")}>Suspend</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "banned")}>Ban</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
