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
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quizData } = await req.json();

    const systemPrompt = `You are a dating profile bio writer for GapRomance, a premium age-gap dating platform. 
Write a warm, engaging, and authentic 3-4 sentence bio in first person based on the user's quiz answers.
The bio should:
- Feel natural and human, not robotic or generic
- Reflect the user's personality, interests, and what they're looking for
- Be flirty but tasteful
- Not list hobbies — weave them naturally into sentences
- Not use clichés like "looking for my other half" or "partner in crime"
- Match the user's dating intent tone (serious vs casual vs open to both)
Return ONLY the bio text, no quotes, no explanation.`;

    const userPrompt = `Generate a dating profile bio based on these quiz answers:

Personality type: ${quizData.personality || "Not specified"}
Hobbies: ${(quizData.hobbies || []).join(", ") || "Not specified"}
Lifestyle: ${(quizData.lifestyle || []).join(", ") || "Not specified"}
Music genres: ${(quizData.music || []).join(", ") || "Not specified"}
Favorite cuisines: ${(quizData.cuisine || []).join(", ") || "Not specified"}
Love language: ${quizData.loveLang || "Not specified"}
Dating intent: ${quizData.intent || "Not specified"}
Dealbreakers: ${(quizData.dealbreakers || []).join(", ") || "None specified"}
Vibe check answer (theme song question): ${quizData.vibeAnswer || "Not answered"}
Prompt answers: ${quizData.promptAnswers ? Object.entries(quizData.promptAnswers).map(([q, a]) => `"${q}": "${a}"`).join("; ") : "None"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Failed to generate bio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const bio = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ bio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-bio error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
