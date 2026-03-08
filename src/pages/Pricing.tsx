 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/pages/Pricing.tsx b/src/pages/Pricing.tsx
index 5f41d2433f860d85117b8181705e11ea678a82e7..d51b58e4430194f2998204f0c3e674d344e981f6 100644
--- a/src/pages/Pricing.tsx
+++ b/src/pages/Pricing.tsx
@@ -34,73 +34,79 @@ const addons = [
 ];
 
 const timePacks = [
   { ...STRIPE_TIME_CREDITS.thirtyMin, label: "30 Minutes", desc: "Quick burst to finish a conversation", icon: "⏱️" },
   { ...STRIPE_TIME_CREDITS.twoHours, label: "2 Hours", desc: "Keep the conversations flowing all evening", icon: "⏰" },
   { ...STRIPE_TIME_CREDITS.unlimitedDay, label: "Unlimited Today", desc: "Message as much as you want — all day, all chats", icon: "♾️" },
 ];
 
 const virtualGifts = [
   { emoji: "🌹", name: "Red Rose", price: "$1" },
   { emoji: "❤️", name: "Heart", price: "$1" },
   { emoji: "🔥", name: "Flame", price: "$1" },
   { emoji: "🍫", name: "Chocolate Box", price: "$2" },
   { emoji: "🥂", name: "Champagne", price: "$2" },
   { emoji: "🎁", name: "Mystery Box", price: "$2" },
   { emoji: "💍", name: "Diamond Ring", price: "$3" },
   { emoji: "👑", name: "Gold Crown", price: "$3" },
   { emoji: "🛥️", name: "Yacht", price: "$5" },
   { emoji: "✈️", name: "Private Jet", price: "$5" },
 ];
 
 const Pricing = () => {
   const { user, subscriptionTier } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
+  const hasAccountSession = Boolean(user?.id && user?.email);
 
   const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
   const checkoutInProgress = useRef(false);
 
   const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription", successUrl?: string) => {
-    // FIX: If user is NOT logged in, redirect to signup with the pricing page as return URL
-    if (!user) {
+    // Guests must sign up first before starting checkout.
+    if (!hasAccountSession) {
       sessionStorage.setItem("pending_checkout", JSON.stringify({ priceId, mode, successUrl }));
       navigate("/signup?redirect=/pricing");
       return;
     }
 
-    // Only proceed if user IS logged in
     if (checkoutInProgress.current) return;
     checkoutInProgress.current = true;
     setCheckoutLoading(priceId);
 
+    const loadingSafetyTimeout = setTimeout(() => {
+      checkoutInProgress.current = false;
+      setCheckoutLoading(null);
+    }, 15000);
+
     try {
       const { data: sessionData } = await supabase.auth.getSession();
       const accessToken = sessionData?.session?.access_token;
 
       if (!accessToken) {
         toast({ title: "Please log in again", description: "Your session has expired.", variant: "destructive" });
+        clearTimeout(loadingSafetyTimeout);
         checkoutInProgress.current = false;
         setCheckoutLoading(null);
         return;
       }
 
       // FIX: Add 10-second timeout using AbortController to prevent endless loading
       const controller = new AbortController();
       const timeoutId = setTimeout(() => {
         controller.abort();
       }, 10000);
 
       try {
         const response = await fetch(
           `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
           {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${accessToken}`,
               "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
             },
             body: JSON.stringify({ priceId, mode, successUrl }),
             signal: controller.signal,
           }
         );
@@ -109,74 +115,74 @@ const Pricing = () => {
 
         const result = await response.json();
 
         if (!response.ok) {
           toast({ title: "Checkout failed", description: result?.error || "Unknown error", variant: "destructive" });
           return;
         }
 
         if (result?.url) {
           window.location.href = result.url;
           return;
         } else {
           toast({ title: "Checkout failed", description: "No checkout URL returned", variant: "destructive" });
         }
       } catch (fetchErr: any) {
         clearTimeout(timeoutId);
         if (fetchErr.name === 'AbortError') {
           toast({ title: "Checkout failed", description: "Request timeout. Please try again.", variant: "destructive" });
         } else {
           throw fetchErr;
         }
       }
     } catch (err: any) {
       toast({ title: "Checkout failed", description: err?.message || "Something went wrong", variant: "destructive" });
     } finally {
+      clearTimeout(loadingSafetyTimeout);
       checkoutInProgress.current = false;
       setCheckoutLoading(null);
     }
   };
 
   useEffect(() => {
-    if (!user) return;
+    if (!hasAccountSession) return;
     const pending = sessionStorage.getItem("pending_checkout");
     if (pending) {
       sessionStorage.removeItem("pending_checkout");
       try {
         const { priceId, mode, successUrl } = JSON.parse(pending);
         if (priceId) handleCheckout(priceId, mode, successUrl);
       } catch {}
     }
-  }, [user]);
+  }, [hasAccountSession]);
 
   const isCurrentPlan = (planName: string) => subscriptionTier === planName.toLowerCase();
 
   return (
     <div className="min-h-screen bg-background">
-      {/* FIX: Show Login/Sign Up buttons when NOT logged in, show Profile/Discover when logged in */}
       <TopNav rightContent={
-        user ? (
+        hasAccountSession ? (
           <>
             <Button variant="ghost" size="sm" asChild><Link to="/discover">Discover</Link></Button>
             <Button variant="hero" size="sm" asChild><Link to="/profile">Profile</Link></Button>
           </>
         ) : (
           <>
             <Button variant="ghost" size="sm" asChild><Link to="/login">Log In</Link></Button>
             <Button variant="hero" size="sm" asChild><Link to="/signup">Sign Up</Link></Button>
           </>
         )
       } />
 
       <div className="container mx-auto px-4 py-16">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
           <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
             Find Your <span className="text-gradient">Perfect Plan</span>
           </h1>
           <p className="text-muted-foreground text-lg max-w-xl mx-auto">
             Upgrade for unlimited connections, advanced features, and a premium dating experience.
           </p>
         </motion.div>
 
         <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
           {plans.map((plan, i) => (
             <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
 
EOF
)
