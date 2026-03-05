import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ flagged: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, message_id } = await req.json();
    if (!content || !message_id) {
      return new Response(JSON.stringify({ flagged: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a content moderation system for a dating platform called GapRomance.
Your job is to detect ONLY violent, threatening, or aggressive content in messages.

IMPORTANT RULES:
- Explicit adult/sexual content between consenting users is ALLOWED and must NEVER be flagged.
- Flirting, romantic language, and intimate conversations are ALLOWED.
- Only flag messages that contain: threats of violence, harassment, bullying, hate speech, intimidation, stalking language, or aggressive/abusive behavior.
- Be conservative: when in doubt, do NOT flag.

Respond with ONLY a JSON object:
{"flagged": true/false, "reason": "brief reason if flagged, null if not"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this message: "${content}"` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI moderation error:", response.status);
      return new Response(JSON.stringify({ flagged: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || "";

    let flagged = false;
    let reason: string | null = null;

    try {
      // Try to parse JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        flagged = parsed.flagged === true;
        reason = parsed.reason || null;
      }
    } catch {
      // If parsing fails, don't flag
      flagged = false;
    }

    // If flagged, update the message in the database
    if (flagged) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await serviceClient
        .from("messages")
        .update({ is_flagged: true, flag_reason: reason })
        .eq("id", message_id);
    }

    return new Response(JSON.stringify({ flagged, reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(JSON.stringify({ flagged: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
