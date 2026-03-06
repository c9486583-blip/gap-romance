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

    // Delete storage files (ignore errors)
    try {
      const { data: files } = await adminClient.storage
        .from("profile-photos")
        .list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from("profile-photos").remove(paths);
      }
    } catch (e) {
      console.error("Storage cleanup error (non-fatal):", e);
    }

    // Delete related data (order matters for foreign keys)
    // Each delete is wrapped to continue even if one fails
    const tables = [
      { table: "virtual_gifts_sent", filter: `sender_id.eq.${userId},receiver_id.eq.${userId}`, type: "or" },
      { table: "messages", filter: userId, column: "sender_id", type: "eq" },
      { table: "reports", filter: userId, column: "reporter_id", type: "eq" },
      { table: "reports", filter: userId, column: "reported_id", type: "eq" },
      { table: "blocks", filter: `blocker_id.eq.${userId},blocked_id.eq.${userId}`, type: "or" },
      { table: "likes", filter: `liker_id.eq.${userId},liked_id.eq.${userId}`, type: "or" },
      { table: "matches", filter: `user_a_id.eq.${userId},user_b_id.eq.${userId}`, type: "or" },
      { table: "messaging_time", filter: userId, column: "user_id", type: "eq" },
      { table: "moderation_logs", filter: userId, column: "sender_id", type: "eq" },
      { table: "notification_preferences", filter: userId, column: "user_id", type: "eq" },
      { table: "push_subscriptions", filter: userId, column: "user_id", type: "eq" },
      { table: "user_roles", filter: userId, column: "user_id", type: "eq" },
      { table: "profiles", filter: userId, column: "user_id", type: "eq" },
    ];

    for (const t of tables) {
      try {
        if (t.type === "or") {
          await adminClient.from(t.table).delete().or(t.filter as string);
        } else {
          await adminClient.from(t.table).delete().eq(t.column!, t.filter);
        }
      } catch (e) {
        console.error(`Failed to delete from ${t.table} (non-fatal):`, e);
      }
    }

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
