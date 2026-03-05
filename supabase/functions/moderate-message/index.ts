import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ classification: "SAFE" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { content, message_id, sender_id, recipient_id, match_id, content_type = "text", image_url } = await req.json();

    if (!content && !image_url) {
      return new Response(JSON.stringify({ classification: "SAFE" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a content moderation assistant for a dating platform called GapRomance. Analyze the following message and classify it as one of three categories:

SAFE — normal conversation, flirting, adult content, or explicit messages between consenting adults. Romantic, sexual, or intimate content is ALWAYS SAFE.

WARNING — aggressive, threatening, intimidating, or violent language or imagery. Harassment, bullying, hate speech, stalking language.

BLOCKED — content involving minors, non-consensual content, blackmail, extortion, or direct threats of physical violence.

CRITICAL RULES:
- Explicit adult/sexual content between consenting adults is ALWAYS classified as SAFE. Never flag it.
- Be conservative: when in doubt, classify as SAFE.
- Only use BLOCKED for the most severe violations.

Respond with ONLY a JSON object: {"classification": "SAFE"|"WARNING"|"BLOCKED", "reason": "one sentence reason"}`;

    // Build messages for AI - support both text and images
    const userMessages: any[] = [];
    if (image_url) {
      userMessages.push({
        role: "user",
        content: [
          { type: "text", text: `Analyze this image for content moderation:${content ? ` Accompanying text: "${content}"` : ""}` },
          { type: "image_url", image_url: { url: image_url } },
        ],
      });
    } else {
      userMessages.push({
        role: "user",
        content: `Analyze this message: "${content}"`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: image_url ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI moderation error:", response.status);
      return new Response(JSON.stringify({ classification: "SAFE" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || "";

    let classification = "SAFE";
    let reason: string | null = null;

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        classification = parsed.classification || "SAFE";
        reason = parsed.reason || null;
        // Validate classification
        if (!["SAFE", "WARNING", "BLOCKED"].includes(classification)) {
          classification = "SAFE";
        }
      }
    } catch {
      classification = "SAFE";
    }

    // Log ALL moderation events (not just flagged ones)
    if (sender_id) {
      await serviceClient.from("moderation_logs").insert({
        sender_id,
        recipient_id: recipient_id || null,
        message_id: message_id || null,
        match_id: match_id || null,
        content: content || (image_url ? "[image]" : null),
        classification,
        reason,
        content_type: image_url ? "image" : "text",
      });
    }

    if (classification === "WARNING" && message_id) {
      // Deliver but flag the message
      await serviceClient
        .from("messages")
        .update({ is_flagged: true, flag_reason: reason })
        .eq("id", message_id);
    }

    if (classification === "BLOCKED" && message_id) {
      // Mark message as blocked — don't deliver
      await serviceClient
        .from("messages")
        .update({ is_blocked: true, is_flagged: true, flag_reason: reason })
        .eq("id", message_id);

      // Auto-flag sender's account for review
      if (sender_id) {
        await serviceClient.from("reports").insert({
          reporter_id: sender_id,
          reported_id: sender_id,
          reason: "Auto-flagged: blocked message",
          context: `Message blocked by AI moderation: ${reason}`,
          source: "auto_moderation",
        });
      }

      // Check for repeat violations (3+ blocked in 30 days)
      if (sender_id) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count } = await serviceClient
          .from("moderation_logs")
          .select("id", { count: "exact", head: true })
          .eq("sender_id", sender_id)
          .eq("classification", "BLOCKED")
          .gte("created_at", thirtyDaysAgo.toISOString());

        if ((count || 0) >= 3) {
          // Auto-suspend the account
          await serviceClient
            .from("profiles")
            .update({ is_suspended: true })
            .eq("user_id", sender_id);

          // Log suspension report
          await serviceClient.from("reports").insert({
            reporter_id: sender_id,
            reported_id: sender_id,
            reason: "Auto-suspended: 3+ blocked messages in 30 days",
            context: `User automatically suspended after ${count} blocked messages within 30 days.`,
            source: "auto_moderation",
          });
        }
      }
    }

    return new Response(JSON.stringify({ classification, reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(JSON.stringify({ classification: "SAFE" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
