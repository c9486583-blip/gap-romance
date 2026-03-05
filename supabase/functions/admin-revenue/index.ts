import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Unauthorized");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all charges for last 6 months
    const charges = await stripe.charges.list({
      created: { gte: Math.floor(sixMonthsAgo.getTime() / 1000) },
      limit: 100,
    });

    let totalThisMonth = 0;
    const monthlyData: Record<string, number> = {};

    for (const charge of charges.data) {
      if (charge.status !== "succeeded") continue;
      const month = new Date(charge.created * 1000).toISOString().slice(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + charge.amount / 100;
      if (charge.created >= Math.floor(startOfMonth.getTime() / 1000)) {
        totalThisMonth += charge.amount / 100;
      }
    }

    // Get active subscriptions with product details
    const subs = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.items.data.price.product"],
    });

    const productBreakdown: Record<string, { count: number; mrr: number }> = {};
    for (const sub of subs.data) {
      for (const item of sub.items.data) {
        const product = item.price.product as Stripe.Product;
        const name = product.name || "Unknown";
        if (!productBreakdown[name]) productBreakdown[name] = { count: 0, mrr: 0 };
        productBreakdown[name].count++;
        productBreakdown[name].mrr += (item.price.unit_amount || 0) / 100;
      }
    }

    const revenueOverTime = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    return new Response(JSON.stringify({
      totalThisMonth,
      productBreakdown,
      revenueOverTime,
      activeSubscriptions: subs.data.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
});
