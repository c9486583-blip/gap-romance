import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map product IDs to credit amounts
const CREDIT_PRODUCTS: Record<string, number> = {
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

    // Get product ID from session
    const lineItem = session.line_items?.data?.[0];
    const price = lineItem?.price;
    const productId = typeof price?.product === "string" ? price.product : price?.product?.id;

    if (!productId || !CREDIT_PRODUCTS[productId]) {
      return new Response(JSON.stringify({ error: "Not a credit purchase" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const creditsToAdd = CREDIT_PRODUCTS[productId];

    // Get current credits
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("message_credits")
      .eq("user_id", user.id)
      .single();

    const currentCredits = profile?.message_credits || 0;

    // Update credits
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ message_credits: currentCredits + creditsToAdd })
      .eq("user_id", user.id);

    if (updateError) throw new Error(`Failed to update credits: ${updateError.message}`);

    return new Response(JSON.stringify({
      success: true,
      credits_added: creditsToAdd,
      total_credits: currentCredits + creditsToAdd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
