import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface VerificationUser {
  user_id: string;
  first_name: string | null;
  last_initial: string | null;
  email: string | null;
  verification_status: string | null;
  created_at: string;
  avatar_url: string | null;
}

const AdminVerification = () => {
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles")
        .select("user_id, first_name, last_initial, email, verification_status, created_at, avatar_url")
        .in("verification_status", ["pending", "requires_input", "processing"])
        .order("created_at", { ascending: false });
      setUsers((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    const status = action === "approve" ? "approved" : "rejected";
    await supabase.from("profiles").update({ verification_status: status, is_verified: action === "approve" }).eq("user_id", userId);
    setUsers(prev => prev.filter(u => u.user_id !== userId));
    toast({ title: `Verification ${action}d` });
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-6">Verification Queue</h2>
      {loading ? <p className="text-muted-foreground">Loading...</p> : users.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-muted-foreground">No pending verifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.user_id} className="glass rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {u.avatar_url ? (
                  <img src={u.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{u.first_name || "User"} {u.last_initial || ""}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground">Status: {u.verification_status} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-green-500 border-green-500/30" onClick={() => handleAction(u.user_id, "approve")}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleAction(u.user_id, "reject")}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
