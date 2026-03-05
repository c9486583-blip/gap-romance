import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { phone } = await req.json();
    if (!phone || phone.length < 10) {
      throw new Error("Valid phone number is required");
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    // Delete any existing codes for this phone
    await supabase
      .from("phone_verifications")
      .delete()
      .eq("phone", phone);

    // Insert new code
    const { error: insertError } = await supabase
      .from("phone_verifications")
      .insert({ phone, code, expires_at: expiresAt });

    if (insertError) throw new Error(`Failed to create verification: ${insertError.message}`);

    // TODO: Integrate SMS provider (Twilio) to send actual SMS
    // For now, log the code for testing purposes
    console.log(`[PHONE-OTP] Code for ${phone}: ${code}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Verification code sent",
      // REMOVE IN PRODUCTION: exposing code for testing only
      _test_code: code,
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
