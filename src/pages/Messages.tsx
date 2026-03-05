import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Gift, ArrowLeft, MoreVertical, Shield, Check, Eye, Crown, Flag, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import GiftPicker from "@/components/GiftPicker";
import GiftBubble from "@/components/GiftBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ContentWarning from "@/components/chat/ContentWarning";
import ReportModal from "@/components/ReportModal";
import BlockConfirmDialog from "@/components/BlockConfirmDialog";
import { VirtualGift } from "@/lib/virtual-gifts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRODUCTS } from "@/lib/stripe-products";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FREE_DAILY_LIMIT = 20;

interface MatchWithProfile {
  matchId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  partnerVerified: boolean;
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
  is_flagged?: boolean;
  is_blocked?: boolean;
  flag_reason?: string | null;
}

const Messages = () => {
  const { user, subscriptionTier, profile } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyCount, setDailyCount] = useState(0);
  const [messageCredits, setMessageCredits] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSource, setReportSource] = useState<"chat_header" | "message">("chat_header");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [creditsSpentThisMonth, setCreditsSpentThisMonth] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);

  const activeMatch = matches.find((m) => m.matchId === activeMatchId);
  const isFreeTier = subscriptionTier === "free";
  const hasFreeMessages = dailyCount < FREE_DAILY_LIMIT;
  const canSendMessage = !isFreeTier || hasFreeMessages || messageCredits > 0;
  const remainingFree = Math.max(0, FREE_DAILY_LIMIT - dailyCount);

  // Sync credits from profile
  useEffect(() => {
    if (profile?.message_credits !== undefined) {
      setMessageCredits(profile.message_credits as number);
    }
    if (profile?.credits_purchased_cents_month !== undefined) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (profile.credits_month_key === currentMonth) {
        setCreditsSpentThisMonth((profile.credits_purchased_cents_month as number) / 100);
      } else {
        setCreditsSpentThisMonth(0);
      }
    }
  }, [profile]);

  // Fetch matches with partner profiles (including verified status)
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

    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedIds = new Set((blocks || []).map((b: any) => b.blocked_id));

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
      .select("user_id, first_name, last_initial, avatar_url, is_verified")
      .in("user_id", partnerIds);

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    const matchList: MatchWithProfile[] = matchRows
      .map((m: any) => {
        const partnerId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
        if (blockedIds.has(partnerId) || blockedByIds.has(partnerId)) return null;
        const prof = profileMap.get(partnerId);
        return {
          matchId: m.id,
          partnerId,
          partnerName: prof
            ? `${prof.first_name || "User"} ${prof.last_initial || ""}`.trim()
            : "User",
          partnerAvatar: prof?.avatar_url || null,
          partnerVerified: prof?.is_verified || false,
          lastMessage: "",
          lastMessageTime: m.created_at,
          unreadCount: 0,
        };
      })
      .filter(Boolean) as MatchWithProfile[];

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

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("match_id", match.matchId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      match.unreadCount = count || 0;
    }

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

  // Realtime subscription for new messages + read receipt updates
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
            if (newMsg.sender_id !== user.id) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMsg.id);
            }
          }
          fetchMatches();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as ChatMessage;
          if (updated.match_id === activeMatchId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeMatchId, fetchMatches]);

  // Typing indicator via broadcast
  useEffect(() => {
    if (!activeMatchId || !user || !activeMatch) return;

    const channel = supabase.channel(`typing-${activeMatchId}`);

    channel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload?.user_id !== user.id) {
          setIsPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      setIsPartnerTyping(false);
    };
  }, [activeMatchId, user, activeMatch]);

  // Online presence via broadcast
  useEffect(() => {
    if (!activeMatchId || !user || !activeMatch) return;

    const presenceChannel = supabase.channel(`presence-${activeMatch.partnerId}`);

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        setIsPartnerOnline(Object.keys(state).length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
      setIsPartnerOnline(false);
    };
  }, [activeMatchId, user, activeMatch]);

  // Also track own presence on the general channel
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`presence-${user.id}`);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const broadcastTyping = () => {
    if (typingChannelRef.current && user) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: user.id },
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !activeMatchId) return;

    const usingCredit = isFreeTier && !hasFreeMessages;

    if (isFreeTier && !hasFreeMessages && messageCredits <= 0) {
      toast({
        title: "No messages remaining",
        description: "Buy message credits or upgrade for unlimited messaging.",
        variant: "destructive",
      });
      return;
    }

    const msgContent = message.trim();
    const { data: inserted, error } = await supabase.from("messages").insert({
      match_id: activeMatchId,
      sender_id: user.id,
      content: msgContent,
    } as any).select().single();

    if (error) {
      toast({ title: "Failed to send", variant: "destructive" });
      return;
    }

    setMessage("");
    setDailyCount((c) => c + 1);

    if (usingCredit) {
      const newCredits = messageCredits - 1;
      setMessageCredits(newCredits);
      await supabase
        .from("profiles")
        .update({ message_credits: newCredits } as any)
        .eq("user_id", user.id);
    }

    // Background content moderation
    if (inserted) {
      supabase.functions.invoke("moderate-message", {
        body: {
          content: msgContent,
          message_id: inserted.id,
          sender_id: user.id,
          recipient_id: activeMatch?.partnerId,
          match_id: activeMatchId,
          content_type: "text",
        },
      }).then(({ data }) => {
        if (data?.classification === "BLOCKED") {
          // Remove the blocked message from local state and notify sender
          setMessages((prev) => prev.filter((m) => m.id !== inserted.id));
          toast({
            title: "Message not delivered",
            description: "This message was not delivered because it violates GapRomance safety guidelines.",
            variant: "destructive",
          });
        }
      }).catch(console.error);
    }
  };

  const handleSendGift = async (gift: VirtualGift) => {
    if (!user || !activeMatch) return;

    await supabase.from("messages").insert({
      match_id: activeMatchId,
      sender_id: user.id,
      content: `🎁 Sent a ${gift.name} ${gift.emoji}`,
    } as any);

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

  const handleBlocked = () => {
    setActiveMatchId(null);
    fetchMatches();
  };

  const openMessageReport = (messageId: string) => {
    setReportMessageId(messageId);
    setReportSource("message");
    setReportOpen(true);
  };

  const openHeaderReport = () => {
    setReportMessageId(null);
    setReportSource("chat_header");
    setReportOpen(true);
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

  if (profile && !profile.is_verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-heading font-bold mb-2">Verification Required</h2>
          <p className="text-muted-foreground mb-6">Complete identity verification to access messages.</p>
          <Button variant="hero" asChild>
            <Link to={profile.verification_status === "not_started" ? "/verify-identity" : "/verification-pending"}>
              {profile.verification_status === "not_started" ? "Start Verification" : "Check Status"}
            </Link>
          </Button>
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
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {c.partnerAvatar ? (
                          <img src={c.partnerAvatar} alt={c.partnerName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">{c.partnerName.charAt(0)}</span>
                        )}
                      </div>
                      {c.partnerVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Shield className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
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
            {/* Chat header with verified badge + online status */}
            <div className="glass border-b border-border/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveMatchId(null)} className="md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {activeMatch.partnerAvatar ? (
                      <img src={activeMatch.partnerAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-muted-foreground">{activeMatch.partnerName.charAt(0)}</span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                    isPartnerOnline ? "bg-green-500" : "bg-muted-foreground/40"
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm">{activeMatch.partnerName}</h3>
                    {activeMatch.partnerVerified && (
                      <Shield className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPartnerOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openHeaderReport} className="text-destructive">
                    <Flag className="w-4 h-4 mr-2" /> Report User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBlockOpen(true)} className="text-destructive">
                    <Ban className="w-4 h-4 mr-2" /> Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Upsell banner for high credit spenders */}
            {isFreeTier && creditsSpentThisMonth >= 10 && (
              <div className="bg-gradient-to-r from-primary/20 to-accent/10 border-b border-primary/20 px-4 py-3 flex items-center gap-3">
                <Crown className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground flex-1">
                  You've spent <span className="font-bold text-primary">${creditsSpentThisMonth.toFixed(2)}</span> on message credits this month.
                  Premium is only <span className="font-bold">${STRIPE_PRODUCTS.premium.price}/month</span> and includes unlimited messaging —{" "}
                  <Link to="/pricing" className="text-primary font-bold underline">upgrade and save</Link>.
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Start the conversation! Say something nice 💬
                </div>
              )}
              {messages.map((m) => {
                const fromMe = m.sender_id === user.id;
                // Hide blocked messages from recipient; sender sees them removed in real-time
                if (m.is_blocked && !fromMe) return null;
                const isGift = m.content.startsWith("🎁 Sent a ");
                if (isGift) {
                  const giftMatch = m.content.match(/🎁 Sent a (.+?) (.+)/);
                  if (giftMatch) {
                    return <GiftBubble key={m.id} emoji={giftMatch[2]} name={giftMatch[1]} fromMe={fromMe} />;
                  }
                }
                return (
                  <div key={m.id} className="group relative">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-1 ${fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                        fromMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}>
                        <p>{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${fromMe ? "justify-end" : ""}`}>
                          <span className={`text-xs ${fromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(m.created_at)}
                          </span>
                          {fromMe && (
                            m.is_read ? (
                              <Eye className="w-3 h-3 text-primary-foreground/60" />
                            ) : (
                              <Check className="w-3 h-3 text-primary-foreground/40" />
                            )
                          )}
                        </div>
                      </div>
                      {/* Per-message report button */}
                      {!fromMe && (
                        <button
                          onClick={() => openMessageReport(m.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-secondary"
                          title="Report message"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </motion.div>
                    {!fromMe && m.is_flagged && (
                      <ContentWarning
                        reason={m.flag_reason}
                        onReport={() => openMessageReport(m.id)}
                        onBlock={() => setBlockOpen(true)}
                      />
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {isPartnerTyping && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/30 relative">
              {/* Free tier limit banner */}
              {isFreeTier && !canSendMessage && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-3 text-center">
                  <p className="text-sm text-foreground font-medium mb-1">
                    You've used all your messages for today.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Link to="/pricing" className="text-primary font-bold underline">Upgrade to Premium</Link> for unlimited messaging
                    or <Link to="/pricing" className="text-primary font-bold underline">purchase message credits</Link>.
                  </p>
                </div>
              )}

              {isFreeTier && canSendMessage && (
                <div className="text-xs text-muted-foreground text-center mb-2 flex items-center justify-center gap-3 flex-wrap">
                  <span>
                    {remainingFree > 0
                      ? `${remainingFree} free message${remainingFree !== 1 ? "s" : ""} left today`
                      : "Using message credits"}
                  </span>
                  {messageCredits > 0 && (
                    <span className="text-primary font-bold">
                      + {messageCredits} credit{messageCredits !== 1 ? "s" : ""}
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
                  onChange={(e) => {
                    setMessage(e.target.value);
                    broadcastTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={canSendMessage ? "Type a message..." : "No messages remaining"}
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

      {/* Report Modal */}
      {activeMatch && (
        <ReportModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          reportedUserId={activeMatch.partnerId}
          messageId={reportMessageId}
          source={reportSource}
        />
      )}

      {/* Block Confirm Dialog */}
      {activeMatch && (
        <BlockConfirmDialog
          open={blockOpen}
          onOpenChange={setBlockOpen}
          blockedUserId={activeMatch.partnerId}
          blockedUserName={activeMatch.partnerName}
          onBlocked={handleBlocked}
        />
      )}
    </div>
  );
};

export default Messages;
