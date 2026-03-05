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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-push`;
    const now = new Date();

    // 1. Today's Note reminder (3+ days inactive)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: noteUsers } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .or(`todays_note_updated_at.is.null,todays_note_updated_at.lt.${threeDaysAgo}`)
      .eq("is_verified", true);

    if (noteUsers) {
      for (const u of noteUsers) {
        await sendPush(edgeFunctionUrl, serviceRoleKey, {
          user_id: u.user_id,
          title: "Add a Today's Note",
          body: "Let people know what you're up to — add a Today's Note to your profile.",
          category: "daily",
        });
      }
    }

    // 2. Daily message reset for free users
    const { data: freeUsers } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .or("subscription_tier.is.null,subscription_tier.eq.free");

    if (freeUsers) {
      for (const u of freeUsers) {
        await sendPush(edgeFunctionUrl, serviceRoleKey, {
          user_id: u.user_id,
          title: "Messages Ready!",
          body: "Your 10 free messages are ready — go start some conversations today.",
          category: "daily",
        });
      }
    }

    // 3. Subscription renewal reminders (3 days before)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const { data: renewUsers } = await supabase
      .from("profiles")
      .select("user_id, subscription_tier, subscription_end")
      .gte("subscription_end", threeDaysFromNow.toISOString())
      .lt("subscription_end", fourDaysFromNow.toISOString())
      .not("subscription_tier", "eq", "free");

    if (renewUsers) {
      for (const u of renewUsers) {
        const tier = u.subscription_tier === "elite" ? "Elite" : "Premium";
        await sendPush(edgeFunctionUrl, serviceRoleKey, {
          user_id: u.user_id,
          title: "Subscription Renewal",
          body: `Your ${tier} subscription renews in 3 days. Manage your subscription in account settings.`,
          category: "subscription",
        });
      }
    }

    // 4. Subscription expiry reminders (1 day before)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const { data: expiryUsers } = await supabase
      .from("profiles")
      .select("user_id, subscription_tier, subscription_end")
      .gte("subscription_end", oneDayFromNow.toISOString())
      .lt("subscription_end", twoDaysFromNow.toISOString())
      .not("subscription_tier", "eq", "free");

    if (expiryUsers) {
      for (const u of expiryUsers) {
        const tier = u.subscription_tier === "elite" ? "Elite" : "Premium";
        await sendPush(edgeFunctionUrl, serviceRoleKey, {
          user_id: u.user_id,
          title: "Subscription Expiring",
          body: `Your ${tier} access expires tomorrow — renew to keep your benefits.`,
          category: "subscription",
        });
      }
    }

    // 5. Inactivity notifications (7 days and 14 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // 7-day inactive users (0 notifications sent so far)
    const { data: inactive7 } = await supabase
      .from("profiles")
      .select("user_id")
      .lt("last_active_at", sevenDaysAgo)
      .gte("last_active_at", fourteenDaysAgo)
      .lte("inactivity_notifications_sent", 0);

    if (inactive7) {
      for (const u of inactive7) {
        await sendPush(edgeFunctionUrl, serviceRoleKey, {
          user_id: u.user_id,
          title: "You're Missed!",
          body: "You have new people waiting to meet you — come back and see who's interested.",
          category: "profile_activity",
        });
        await supabase
          .from("profiles")
          .update({ inactivity_notifications_sent: 1 } as any)
          .eq("user_id", u.user_id);
      }
    }

    // 14-day inactive users (1 notification sent)
    const { data: inactive14 } = await supabase
      .from("profiles")
      .select("user_id")
      .lt("last_active_at", fourteenDaysAgo)
      .eq("inactivity_notifications_sent", 1);

    if (inactive14) {
      for (const u of inactive14) {
        // Count recent likes for this user
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("liked_id", u.user_id)
          .gte("created_at", fourteenDaysAgo);

        const likeCount = count || 0;
        await sendPush(edgeFunctionUrl, serviceRoleKey, {
          user_id: u.user_id,
          title: "Don't Let Matches Go Cold",
          body: `Don't let your matches go cold — ${likeCount} people have liked your profile recently.`,
          category: "profile_activity",
        });
        await supabase
          .from("profiles")
          .update({ inactivity_notifications_sent: 2 } as any)
          .eq("user_id", u.user_id);
      }
    }

    // 6. Profile completeness reminder (24h after verification, <70%)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgoStr = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const { data: incompleteProfiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, bio, photos, hobbies, lifestyle_badges, personality_badges, love_language, prompt_answers, city, date_of_birth")
      .eq("is_verified", true)
      .lte("updated_at", oneDayAgo)
      .gte("updated_at", twoDaysAgoStr);

    if (incompleteProfiles) {
      for (const p of incompleteProfiles) {
        // Simple completeness check
        let filled = 0;
        const total = 10;
        if (p.first_name) filled++;
        if (p.date_of_birth) filled++;
        if (p.bio) filled++;
        if (p.photos && p.photos.length > 0) filled++;
        if (p.city) filled++;
        if (p.hobbies && p.hobbies.length >= 3) filled++;
        if (p.lifestyle_badges && p.lifestyle_badges.length > 0) filled++;
        if (p.personality_badges && p.personality_badges.length > 0) filled++;
        if (p.love_language) filled++;
        if (p.prompt_answers && Array.isArray(p.prompt_answers) && p.prompt_answers.length > 0) filled++;

        const pct = Math.round((filled / total) * 100);
        if (pct < 70) {
          await sendPush(edgeFunctionUrl, serviceRoleKey, {
            user_id: p.user_id,
            title: "Complete Your Profile",
            body: "Your profile is almost ready — complete it now to start appearing in discovery and getting matches.",
            category: "profile_activity",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scheduled-notifications error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendPush(edgeFunctionUrl: string, serviceRoleKey: string, payload: any) {
  try {
    await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("Failed to send push:", e);
  }
}
