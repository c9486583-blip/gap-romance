import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profile with verification session ID
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("verification_session_id, verification_status, is_verified")
      .eq("user_id", user.id)
      .single();

    if (!profile?.verification_session_id) {
      return new Response(JSON.stringify({
        status: "not_started",
        is_verified: profile?.is_verified || false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already verified, return early
    if (profile.is_verified) {
      return new Response(JSON.stringify({
        status: "verified",
        is_verified: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Stripe Identity session status
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/identity/verification_sessions/${profile.verification_session_id}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );

    const session = await stripeRes.json();
    const stripeStatus = session.status; // requires_input, processing, verified, canceled

    let newStatus = profile.verification_status;
    let isVerified = false;
    let lastError = null;

    if (stripeStatus === "verified") {
      newStatus = "verified";
      isVerified = true;
    } else if (stripeStatus === "requires_input") {
      // Check if there was an error (failed verification)
      if (session.last_error) {
        newStatus = "failed";
        lastError = session.last_error.reason || session.last_error.code || "Verification failed";
      } else {
        newStatus = "requires_input";
      }
    } else if (stripeStatus === "processing") {
      newStatus = "processing";
    } else if (stripeStatus === "canceled") {
      newStatus = "canceled";
    }

    // Update profile
    await serviceClient
      .from("profiles")
      .update({
        verification_status: newStatus,
        is_verified: isVerified,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      status: newStatus,
      is_verified: isVerified,
      last_error: lastError,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
