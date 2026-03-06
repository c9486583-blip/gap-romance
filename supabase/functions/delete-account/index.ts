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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role to delete everything
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Delete storage files
    const { data: files } = await adminClient.storage
      .from("profile-photos")
      .list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f: any) => `${userId}/${f.name}`);
      await adminClient.storage.from("profile-photos").remove(paths);
    }

    // Delete related data (order matters for foreign keys)
    await adminClient.from("virtual_gifts_sent").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    await adminClient.from("messages").delete().eq("sender_id", userId);
    await adminClient.from("reports").delete().eq("reporter_id", userId);
    await adminClient.from("reports").delete().eq("reported_id", userId);
    await adminClient.from("blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    await adminClient.from("likes").delete().or(`liker_id.eq.${userId},liked_id.eq.${userId}`);
    await adminClient.from("matches").delete().or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
    await adminClient.from("messaging_time").delete().eq("user_id", userId);
    await adminClient.from("moderation_logs").delete().eq("sender_id", userId);
    await adminClient.from("notification_preferences").delete().eq("user_id", userId);
    await adminClient.from("push_subscriptions").delete().eq("user_id", userId);
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
