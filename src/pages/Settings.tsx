import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell, Shield, LogOut, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Safety", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/profile">Profile</Link></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-60 flex-shrink-0">
            <div className="space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    activeTab === t.id
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              ))}
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 glass rounded-xl p-6">
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Account Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Display Name</label>
                    <input defaultValue="James W." className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Email</label>
                    <input defaultValue="james@example.com" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Phone</label>
                    <input defaultValue="+1 (555) 123-4567" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <Button variant="hero">Save Changes</Button>
                </div>
              </div>
            )}
            {activeTab === "subscription" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Your Plan</h2>
                <div className="glass rounded-xl p-6 glow-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold">Premium</h3>
                      <p className="text-sm text-muted-foreground">Renews March 15, 2026</p>
                    </div>
                    <span className="text-2xl font-heading font-bold text-gradient">$39/mo</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="hero" asChild><Link to="/pricing">Upgrade to Elite</Link></Button>
                    <Button variant="outline">Cancel Plan</Button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Notifications</h2>
                {["New matches", "Messages", "Likes", "Profile views", "Promotions"].map((n) => (
                  <label key={n} className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
                    <span className="text-sm">{n}</span>
                    <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  </label>
                ))}
              </div>
            )}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h2 className="font-heading text-xl font-semibold">Privacy & Safety</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
                    <div>
                      <span className="text-sm block">Show online status</span>
                      <span className="text-xs text-muted-foreground">Let others see when you're active</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between py-3 border-b border-border/30 cursor-pointer">
                    <div>
                      <span className="text-sm block">Read receipts</span>
                      <span className="text-xs text-muted-foreground">Show when you've read messages</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                  </label>
                  <div className="pt-4">
                    <Button variant="outline">Block List</Button>
                  </div>
                  <div className="pt-2">
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
