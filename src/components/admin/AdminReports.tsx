import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, AlertTriangle, Ban, Eye } from "lucide-react";

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
  admin_notes: string | null;
  reporter_name?: string;
  reported_name?: string;
}

const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data } = await query;
      if (!data) { setReports([]); setLoading(false); return; }

      const userIds = [...new Set(data.flatMap((r: any) => [r.reporter_id, r.reported_id]))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_initial").in("user_id", userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, `${p.first_name || "User"} ${p.last_initial || ""}`.trim()]));

      setReports(data.map((r: any) => ({
        ...r,
        reporter_name: nameMap.get(r.reporter_id) || "Unknown",
        reported_name: nameMap.get(r.reported_id) || "Unknown",
      })));
      setLoading(false);
    };
    fetchReports();
  }, [filter]);

  const updateStatus = async (reportId: string, status: string) => {
    await supabase.from("reports").update({ status } as any).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    toast({ title: `Report marked as ${status}` });
  };

  const saveNotes = async () => {
    if (!selectedReport) return;
    await supabase.from("reports").update({ admin_notes: notes } as any).eq("id", selectedReport.id);
    setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, admin_notes: notes } : r));
    toast({ title: "Notes saved" });
  };

  const statusIcon = (s: string) => {
    if (s === "pending") return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    if (s === "reviewed" || s === "resolved") return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (s === "warned") return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
    return <Ban className="w-3.5 h-3.5 text-destructive" />;
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-6">Reports Dashboard</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["pending", "reviewed", "resolved", "warned", "suspended", "banned", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
              filter === s ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}>{s}</button>
        ))}
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : reports.length === 0 ? (
        <p className="text-muted-foreground">No reports found.</p>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
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
                  {r.admin_notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {r.admin_notes}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedReport(r); setNotes(r.admin_notes || ""); }}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "resolved")}>Resolve</Button>
                      <Button size="sm" variant="outline" className="border-destructive/30 text-destructive" onClick={() => updateStatus(r.id, "warned")}>Warn</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "banned")}>Ban</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Details</DialogTitle></DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Reporter:</span> {selectedReport.reporter_name}</p>
                <p><span className="text-muted-foreground">Reported:</span> {selectedReport.reported_name}</p>
                <p><span className="text-muted-foreground">Reason:</span> <span className="text-destructive font-medium">{selectedReport.reason}</span></p>
                <p><span className="text-muted-foreground">Source:</span> {selectedReport.source}</p>
                {selectedReport.context && <p><span className="text-muted-foreground">Context:</span> {selectedReport.context}</p>}
                <p><span className="text-muted-foreground">Date:</span> {new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes..." className="mt-1" />
                <Button size="sm" className="mt-2" onClick={saveNotes}>Save Notes</Button>
              </div>
              {selectedReport.status === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedReport.id, "resolved"); setSelectedReport(null); }}>Resolve</Button>
                  <Button size="sm" variant="outline" className="border-destructive/30 text-destructive" onClick={() => { updateStatus(selectedReport.id, "warned"); setSelectedReport(null); }}>Warn</Button>
                  <Button size="sm" variant="destructive" onClick={() => { updateStatus(selectedReport.id, "banned"); setSelectedReport(null); }}>Ban User</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
