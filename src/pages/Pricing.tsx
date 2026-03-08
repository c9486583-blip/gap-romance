 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/pages/Pricing.tsx b/src/pages/Pricing.tsx
index 72d8c68171a6aecef12a42ea3a45f4959a15ee29..e21ce917ef17fc52b91bb54a902810a057c41fe3 100644
--- a/src/pages/Pricing.tsx
+++ b/src/pages/Pricing.tsx
@@ -59,53 +59,58 @@ const Pricing = () => {
       toast({ title: "Please log in first", variant: "destructive" });
       return;
     }
     try {
       const { data, error } = await supabase.functions.invoke("create-checkout", {
         body: { priceId, mode, successUrl },
       });
       if (error || !data?.url) {
         toast({ title: "Checkout failed", description: error?.message || "Please try again", variant: "destructive" });
         return;
       }
       window.location.href = data.url;
     } catch (err: any) {
       console.error("Checkout error:", err);
       toast({ title: "Checkout failed", description: err?.message || "Please try again", variant: "destructive" });
     }
   };
 
   const isCurrentPlan = (planName: string) => subscriptionTier === planName.toLowerCase();
 
   return (
     <div className="min-h-screen bg-background">
       <nav className="sticky top-0 z-50 glass border-b border-border/30">
         <div className="container mx-auto flex items-center justify-between h-16 px-4">
           <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
-          <Button variant="hero" size="sm" asChild>
-            <Link to={user ? "/discover" : "/signup"}>{user ? "Discover" : "Join Free"}</Link>
-          </Button>
+          <div className="flex items-center gap-3">
+            <Button variant="ghost" size="sm" asChild>
+              <Link to="/login">Log In</Link>
+            </Button>
+            <Button variant="hero" size="sm" asChild>
+              <Link to="/signup">Join Free</Link>
+            </Button>
+          </div>
         </div>
       </nav>
 
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
               className={`glass rounded-2xl p-8 relative hover-lift ${plan.popular ? "glow-border" : ""} ${isCurrentPlan(plan.name) ? "ring-2 ring-primary" : ""}`}>
               {isCurrentPlan(plan.name) && (
                 <div className="absolute -top-3 right-4">
                   <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">YOUR PLAN</span>
                 </div>
               )}
               {plan.popular && !isCurrentPlan(plan.name) && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                   <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
 
EOF
)
