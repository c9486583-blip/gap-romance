import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, AlertTriangle, Shield, CheckCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_initial: string | null;
  email: string | null;
  date_of_birth: string | null;
  is_verified: boolean | null;
  subscription_tier: string | null;
  created_at: string;
  is_suspended: boolean;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  photos: string[] | null;
  verification_status: string | null;
  ban_reason: string | null;
  suspension_end: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionUser, setActionUser] = useState<UserProfile | null>(null);
  const [suspendDays, setSuspendDays] = useState("7");
  const [banReason, setBanReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
      setUsers((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.first_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.user_id.includes(q);
  });

  const getAge = (dob: string | null) => {
    if (!dob) return "—";
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getStatus = (u: UserProfile) => {
    if (u.ban_reason) return "banned";
    if (u.is_suspended) return "suspended";
    return "active";
  };

  const openAction = (type: string, user: UserProfile) => {
    setActionType(type);
    setActionUser(user);
    setSelectedUser(null);
  };

  const handleAction = async (action: string) => {
    if (!actionUser) return;
    const userId = actionUser.user_id;

    if (action === "warn") {
      toast({ title: "Warning sent", description: `Warning sent to ${actionUser.first_name}` });
    } else if (action === "suspend") {
      const end = new Date();
      end.setDate(end.getDate() + parseInt(suspendDays));
      await supabase.from("profiles").update({ is_suspended: true, suspension_end: end.toISOString() } as any).eq("user_id", userId);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_suspended: true, suspension_end: end.toISOString() } : u));
      toast({ title: "User suspended", description: `Suspended for ${suspendDays} days` });
    } else if (action === "ban") {
      await supabase.from("profiles").update({ is_suspended: true, ban_reason: banReason || "Permanently banned" } as any).eq("user_id", userId);
      if (actionUser.phone) {
        await supabase.from("banned_identifiers").insert({ identifier_type: "phone", identifier_value: actionUser.phone, reason: banReason } as any);
      }
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_suspended: true, ban_reason: banReason || "Permanently banned" } : u));
      toast({ title: "User permanently banned", variant: "destructive" });
    } else if (action === "verify") {
      await supabase.from("profiles").update({ is_verified: true, verification_status: "approved" }).eq("user_id", userId);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_verified: true } : u));
      toast({ title: "User manually verified" });
    }
    setActionType(null);
    setActionUser(null);
    setBanReason("");
    setSuspendDays("7");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-heading font-bold">User Management</h2>
        <span className="text-sm text-muted-foreground">({filtered.length} users)</span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? <p className="text-muted-foreground">Loading users...</p> : (
        <div className="glass rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.first_name || "—"} {u.last_initial || ""}</TableCell>
                  <TableCell className="text-xs">{u.email || "—"}</TableCell>
                  <TableCell>{getAge(u.date_of_birth)}</TableCell>
                  <TableCell>{u.is_verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs capitalize">{u.subscription_tier || "free"}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatus(u) === "active" ? "secondary" : "destructive"} className="text-xs capitalize">{getStatus(u)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedUser(u)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openAction("menu", u)}><Shield className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedUser?.first_name} {selectedUser?.last_initial} — Profile</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selectedUser.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedUser.phone || "—"}</div>
                <div><span className="text-muted-foreground">DOB:</span> {selectedUser.date_of_birth || "—"}</div>
                <div><span className="text-muted-foreground">Verified:</span> {selectedUser.is_verified ? "Yes" : "No"}</div>
                <div><span className="text-muted-foreground">Tier:</span> {selectedUser.subscription_tier || "free"}</div>
                <div><span className="text-muted-foreground">Status:</span> {getStatus(selectedUser)}</div>
                <div><span className="text-muted-foreground">Joined:</span> {new Date(selectedUser.created_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Verification:</span> {selectedUser.verification_status}</div>
              </div>
              {selectedUser.bio && <div><span className="text-muted-foreground text-sm">Bio:</span><p className="text-sm mt-1">{selectedUser.bio}</p></div>}
              {selectedUser.photos && selectedUser.photos.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Photos:</span>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedUser.photos.map((p, i) => <img key={i} src={p} className="w-20 h-20 rounded-lg object-cover" alt="" />)}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => openAction("warn", selectedUser)}>
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Warn
                </Button>
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive" onClick={() => openAction("suspend", selectedUser)}>
                  Suspend
                </Button>
                <Button size="sm" variant="destructive" onClick={() => openAction("ban", selectedUser)}>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Ban
                </Button>
                {!selectedUser.is_verified && (
                  <Button size="sm" variant="outline" onClick={() => { handleAction("verify"); setSelectedUser(null); }}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Menu Dialog */}
      <Dialog open={actionType === "menu"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Actions — {actionUser?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("warn")}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Send Warning
            </Button>
            <Button variant="outline" className="w-full justify-start border-destructive/30 text-destructive" onClick={() => setActionType("suspend")}>
              Suspend Account
            </Button>
            <Button variant="destructive" className="w-full justify-start" onClick={() => setActionType("ban")}>
              <Ban className="w-4 h-4 mr-2" /> Permanently Ban
            </Button>
            {actionUser && !actionUser.is_verified && (
              <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("verify")}>
                <CheckCircle className="w-4 h-4 mr-2" /> Verify Manually
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={actionType === "suspend"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspend {actionUser?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Duration (days)</label>
            <Input type="number" value={suspendDays} onChange={e => setSuspendDays(e.target.value)} min="1" max="365" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleAction("suspend")}>Suspend</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={actionType === "ban"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Permanently Ban {actionUser?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Reason</label>
            <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for permanent ban..." />
            <p className="text-xs text-destructive">This will permanently ban the user and block their phone number from creating new accounts.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleAction("ban")}>Permanently Ban</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
