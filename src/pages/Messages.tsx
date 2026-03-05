import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Gift, ArrowLeft, Flag, Ban, AlertTriangle, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import GiftPicker from "@/components/GiftPicker";
import GiftBubble from "@/components/GiftBubble";
import { VirtualGift } from "@/lib/virtual-gifts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  "Harassment",
  "Fake Profile",
  "Threats or Violence",
  "Scam or Fraud",
  "Inappropriate Content",
  "Underage User",
  "Other",
];

const FREE_DAILY_LIMIT = 10;

interface MatchWithProfile {
  matchId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const Messages = () => {
  const { user, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyCount, setDailyCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportContext, setReportContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMatch = matches.find((m) => m.matchId === activeMatchId);
  const isFreeTier = subscriptionTier === "free";
  const canSendMessage = !isFreeTier || dailyCount < FREE_DAILY_LIMIT;

  // Fetch matches with partner profiles
  const fetchMatches = useCallback(async () => {
    if (!user) return;
    const { data: matchRows } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    if (!matchRows || matchRows.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    // Check blocks
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedIds = new Set((blocks || []).map((b: any) => b.blocked_id));

    // Also check if blocked BY someone
    const { data: blockedBy } = await supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocked_id", user.id);
    const blockedByIds = new Set((blockedBy || []).map((b: any) => b.blocker_id));

    const partnerIds = matchRows
      .map((m: any) => (m.user_a_id === user.id ? m.user_b_id : m.user_a_id))
      .filter((id: string) => !blockedIds.has(id) && !blockedByIds.has(id));

    if (partnerIds.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_initial, avatar_url")
      .in("user_id", partnerIds);

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    const matchList: MatchWithProfile[] = matchRows
      .map((m: any) => {
        const partnerId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
        if (blockedIds.has(partnerId) || blockedByIds.has(partnerId)) return null;
        const profile = profileMap.get(partnerId);
        return {
          matchId: m.id,
          partnerId,
          partnerName: profile
            ? `${profile.first_name || "User"} ${profile.last_initial || ""}`.trim()
            : "User",
          partnerAvatar: profile?.avatar_url || null,
          lastMessage: "",
          lastMessageTime: m.created_at,
          unreadCount: 0,
        };
      })
      .filter(Boolean) as MatchWithProfile[];

    // Fetch last message for each match
    for (const match of matchList) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, is_read")
        .eq("match_id", match.matchId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastMsg && lastMsg.length > 0) {
        match.lastMessage = lastMsg[0].content;
        match.lastMessageTime = lastMsg[0].created_at;
      }

      // Count unread
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("match_id", match.matchId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      match.unreadCount = count || 0;
    }

    // Sort by last message time
    matchList.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setMatches(matchList);
    setLoading(false);
  }, [user]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async () => {
    if (!activeMatchId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", activeMatchId)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessage[]) || []);

    // Mark unread messages as read
    if (user) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("match_id", activeMatchId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    }
  }, [activeMatchId, user]);

  // Fetch daily message count
  const fetchDailyCount = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", today.toISOString());
    setDailyCount(count || 0);
  }, [user]);

  useEffect(() => {
    fetchMatches();
    fetchDailyCount();
  }, [fetchMatches, fetchDailyCount]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.match_id === activeMatchId) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark as read if not from me
            if (newMsg.sender_id !== user.id) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMsg.id);
            }
          }
          // Refresh match list for last message preview
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeMatchId, fetchMatches]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !activeMatchId) return;
    if (isFreeTier && dailyCount >= FREE_DAILY_LIMIT) {
      toast({
        title: "Daily limit reached",
        description: "Upgrade to Premium or Elite for unlimited messaging.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("messages").insert({
      match_id: activeMatchId,
      sender_id: user.id,
      content: message.trim(),
    } as any);

    if (error) {
      toast({ title: "Failed to send", variant: "destructive" });
      return;
    }

    setMessage("");
    setDailyCount((c) => c + 1);
  };

  const handleSendGift = async (gift: VirtualGift) => {
    if (!user || !activeMatch) return;

    // Save gift as message
    await supabase.from("messages").insert({
      match_id: activeMatchId,
      sender_id: user.id,
      content: `🎁 Sent a ${gift.name} ${gift.emoji}`,
    } as any);

    // Save to virtual_gifts_sent
    await supabase.from("virtual_gifts_sent").insert({
      sender_id: user.id,
      receiver_id: activeMatch.partnerId,
      gift_id: gift.id,
      gift_name: gift.name,
      gift_emoji: gift.emoji,
      gift_price: gift.price,
    });

    setGiftOpen(false);
  };

  const handleBlock = async () => {
    if (!user || !activeMatch) return;
    await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: activeMatch.partnerId,
    } as any);
    toast({ title: "User blocked" });
    setActiveMatchId(null);
    fetchMatches();
  };

  const handleReport = async () => {
    if (!user || !activeMatch || !reportReason) return;
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: activeMatch.partnerId,
      reason: reportReason,
      context: reportContext || null,
    } as any);
    toast({ title: "Report submitted", description: "Our safety team will review this." });
    setReportOpen(false);
    setReportReason("");
    setReportContext("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view your messages</p>
          <Button variant="hero" asChild><Link to="/login">Log In</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/profile">Profile</Link></Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-border/30 flex-shrink-0 ${activeMatchId !== null ? "hidden md:block" : ""}`}>
          <div className="p-4">
            <h2 className="font-heading text-xl font-bold mb-4">Messages</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No matches yet</p>
                <p className="text-sm text-muted-foreground mb-4">Start discovering people to find your match!</p>
                <Button variant="hero" size="sm" asChild><Link to="/discover">Discover</Link></Button>
              </div>
            ) : (
              <div className="space-y-1">
                {matches.map((c) => (
                  <button
                    key={c.matchId}
                    onClick={() => setActiveMatchId(c.matchId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      activeMatchId === c.matchId ? "bg-primary/10" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {c.partnerAvatar ? (
                        <img src={c.partnerAvatar} alt={c.partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">{c.partnerName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">{c.partnerName}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(c.lastMessageTime)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.lastMessage || "New match! Say hello 👋"}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeMatchId && activeMatch ? (
          <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="glass border-b border-border/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveMatchId(null)} className="md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {activeMatch.partnerAvatar ? (
                    <img src={activeMatch.partnerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-muted-foreground">{activeMatch.partnerName.charAt(0)}</span>
                  )}
                </div>
                <h3 className="font-bold text-sm">{activeMatch.partnerName}</h3>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                    <Flag className="w-4 h-4 mr-2" /> Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                    <Ban className="w-4 h-4 mr-2" /> Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Start the conversation! Say something nice 💬
                </div>
              )}
              {messages.map((m) => {
                const fromMe = m.sender_id === user.id;
                const isGift = m.content.startsWith("🎁 Sent a ");
                if (isGift) {
                  const giftMatch = m.content.match(/🎁 Sent a (.+?) (.+)/);
                  if (giftMatch) {
                    return <GiftBubble key={m.id} emoji={giftMatch[2]} name={giftMatch[1]} fromMe={fromMe} />;
                  }
                }
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                      fromMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${fromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/30 relative">
              {isFreeTier && (
                <div className="text-xs text-muted-foreground text-center mb-2">
                  {dailyCount}/{FREE_DAILY_LIMIT} daily messages used
                  {!canSendMessage && (
                    <span className="text-destructive ml-1">
                      — <Link to="/pricing" className="underline">Upgrade</Link> for unlimited
                    </span>
                  )}
                </div>
              )}
              <GiftPicker open={giftOpen} onClose={() => setGiftOpen(false)} onSend={handleSendGift} />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setGiftOpen((v) => !v)}>
                  <Gift className="w-5 h-5 text-primary" />
                </Button>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={canSendMessage ? "Type a message..." : "Daily limit reached"}
                  disabled={!canSendMessage}
                  maxLength={2000}
                  className="flex-1 bg-secondary border border-border rounded-full px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <Button
                  variant="hero"
                  size="icon"
                  className="rounded-full"
                  onClick={handleSendMessage}
                  disabled={!canSendMessage || !message.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground">
            {matches.length > 0 ? "Select a conversation to start chatting" : "Find matches to start chatting"}
          </div>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Report User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground"
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Additional details (optional)</label>
              <textarea
                value={reportContext}
                onChange={(e) => setReportContext(e.target.value)}
                maxLength={1000}
                placeholder="Provide any additional context..."
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={!reportReason}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
