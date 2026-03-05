import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Gift, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import GiftPicker from "@/components/GiftPicker";
import GiftBubble from "@/components/GiftBubble";
import { VirtualGift } from "@/lib/virtual-gifts";

const mockConversations = [
  {
    id: 1, name: "Sophia M.", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop",
    lastMsg: "That sounds amazing! Let's do it 🥂", time: "2m ago", unread: 2,
  },
  {
    id: 2, name: "Emma R.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    lastMsg: "Haha you're so funny", time: "1h ago", unread: 0,
  },
  {
    id: 3, name: "Mia L.", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop",
    lastMsg: "I'd love to hear more about that", time: "3h ago", unread: 0,
  },
];

type ChatMessage = {
  id: number;
  from: "me" | "them";
  text?: string;
  time: string;
  gift?: { emoji: string; name: string };
};

const initialMessages: ChatMessage[] = [
  { id: 1, from: "them", text: "Hey! I saw you like jazz too 🎷", time: "10:30 AM" },
  { id: 2, from: "me", text: "Yes! I'm obsessed. Have you been to the Blue Note?", time: "10:32 AM" },
  { id: 3, from: "them", text: "Not yet but it's on my list! We should go together sometime", time: "10:33 AM" },
  { id: 4, from: "me", text: "I'd love that. How about this Friday?", time: "10:35 AM" },
  { id: 5, from: "them", text: "That sounds amazing! Let's do it 🥂", time: "10:36 AM" },
];

const Messages = () => {
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [message, setMessage] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const active = mockConversations.find((c) => c.id === activeChat);

  const handleSendGift = (gift: VirtualGift) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "me", time, gift: { emoji: gift.emoji, name: gift.name } },
    ]);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { id: Date.now(), from: "me", text: message, time }]);
    setMessage("");
  };

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
        <div className={`w-full md:w-80 border-r border-border/30 flex-shrink-0 ${activeChat !== null ? "hidden md:block" : ""}`}>
          <div className="p-4">
            <h2 className="font-heading text-xl font-bold mb-4">Messages</h2>
            <div className="space-y-1">
              {mockConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChat(c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeChat === c.id ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                >
                  <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.lastMsg}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        {activeChat !== null && active ? (
          <div className="flex-1 flex flex-col">
            <div className="glass border-b border-border/30 p-4 flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="md:hidden">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img src={active.avatar} alt={active.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h3 className="font-bold text-sm">{active.name}</h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) =>
                m.gift ? (
                  <GiftBubble key={m.id} emoji={m.gift.emoji} name={m.gift.name} fromMe={m.from === "me"} />
                ) : (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                      m.from === "me"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}>
                      <p>{m.text}</p>
                      <p className={`text-xs mt-1 ${m.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {m.time}
                      </p>
                    </div>
                  </motion.div>
                )
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/30 relative">
              <GiftPicker open={giftOpen} onClose={() => setGiftOpen(false)} onSend={handleSendGift} />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setGiftOpen((v) => !v)}>
                  <Gift className="w-5 h-5 text-primary" />
                </Button>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border border-border rounded-full px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <Button variant="hero" size="icon" className="rounded-full" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
