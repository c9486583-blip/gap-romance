import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Time credit products: product_id -> { seconds, unlimited }
const TIME_PRODUCTS: Record<string, { seconds: number; unlimited: boolean }> = {
  "prod_U5zq04PHrIkLY9": { seconds: 1800, unlimited: false },   // 30 min
  "prod_U5zqXPmEXJEODu": { seconds: 7200, unlimited: false },   // 2 hours
  "prod_U5zq0I05x3tFuj": { seconds: 0, unlimited: true },        // unlimited day
};

// Legacy credit products
const LEGACY_CREDIT_PRODUCTS: Record<string, number> = {
  "prod_U5hXkLER7CXGJn": 20,
  "prod_U5hXLqOlLWo7Tb": 50,
  "prod_U5hY76J4vz5ZcK": 100,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { session_id } = await req.json();
    if (!session_id) throw new Error("No session_id provided");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const lineItem = session.line_items?.data?.[0];
    const price = lineItem?.price;
    const productId = typeof price?.product === "string" ? price.product : price?.product?.id;

    if (!productId) {
      return new Response(JSON.stringify({ error: "No product found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if it's a time credit purchase
    if (TIME_PRODUCTS[productId]) {
      const timeProd = TIME_PRODUCTS[productId];
      const today = new Date().toISOString().slice(0, 10);

      // Get or create today's record
      const { data: existing } = await supabaseClient
        .from("messaging_time")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        const updates: any = { updated_at: new Date().toISOString() };
        if (timeProd.unlimited) {
          updates.has_unlimited = true;
        } else {
          updates.bonus_seconds = (existing.bonus_seconds || 0) + timeProd.seconds;
        }
        await supabaseClient
          .from("messaging_time")
          .update(updates)
          .eq("user_id", user.id)
          .eq("date", today);
      } else {
        await supabaseClient.from("messaging_time").insert({
          user_id: user.id,
          date: today,
          seconds_used: 0,
          bonus_seconds: timeProd.unlimited ? 0 : timeProd.seconds,
          has_unlimited: timeProd.unlimited,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        type: "time_credit",
        unlimited: timeProd.unlimited,
        seconds_added: timeProd.seconds,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Legacy credit purchase
    if (LEGACY_CREDIT_PRODUCTS[productId]) {
      const creditsToAdd = LEGACY_CREDIT_PRODUCTS[productId];
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("message_credits")
        .eq("user_id", user.id)
        .single();

      const currentCredits = profile?.message_credits || 0;
      await supabaseClient
        .from("profiles")
        .update({ message_credits: currentCredits + creditsToAdd })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({
        success: true,
        type: "legacy_credits",
        credits_added: creditsToAdd,
        total_credits: currentCredits + creditsToAdd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Unknown product" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
