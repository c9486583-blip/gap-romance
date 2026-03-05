import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Ban } from "lucide-react";

interface ModerationLog {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string | null;
  classification: string;
  reason: string | null;
  content_type: string;
  created_at: string;
  sender_name?: string;
}

const AdminModeration = () => {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      let query = supabase.from("moderation_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") query = query.eq("classification", filter.toUpperCase());
      const { data } = await query as any;
      if (!data) { setLogs([]); return; }

      const userIds = [...new Set(data.map((l: any) => l.sender_id))] as string[];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_initial").in("user_id", userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, `${p.first_name || "User"} ${p.last_initial || ""}`.trim()]));

      setLogs(data.map((l: any) => ({ ...l, sender_name: nameMap.get(l.sender_id) || "Unknown" })));
    };
    fetchLogs();
  }, [filter]);

  const suspendUser = async (userId: string) => {
    await supabase.from("profiles").update({ is_suspended: true } as any).eq("user_id", userId);
    toast({ title: "User suspended" });
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-6">Content Moderation Log</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "safe", "warning", "blocked"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
              filter === s ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}>{s}</button>
        ))}
      </div>

      {logs.length === 0 ? <p className="text-muted-foreground">No logs found.</p> : (
        <div className="space-y-2">
          {logs.map(l => (
            <div key={l.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      l.classification === "SAFE" ? "bg-green-500/10 text-green-500" :
                      l.classification === "WARNING" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-destructive/10 text-destructive"
                    }`}>{l.classification}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{l.content_type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm"><span className="text-muted-foreground">Sender:</span> <span className="font-medium">{l.sender_name}</span></p>
                  {l.content && <p className="text-sm text-muted-foreground mt-1 truncate max-w-xl"><Eye className="w-3 h-3 inline mr-1" />{l.content}</p>}
                  {l.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {l.reason}</p>}
                </div>
                {l.classification !== "SAFE" && (
                  <Button size="sm" variant="outline" className="border-destructive/30 text-destructive" onClick={() => suspendUser(l.sender_id)}>
                    <Ban className="w-3 h-3 mr-1" /> Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
