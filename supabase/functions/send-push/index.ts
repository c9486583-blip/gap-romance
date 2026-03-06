import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push utilities using Web Crypto API
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function createVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key
  const pubKeyRaw = base64UrlToUint8Array(vapidPublicKey);
  const x = uint8ArrayToBase64Url(pubKeyRaw.slice(1, 33));
  const y = uint8ArrayToBase64Url(pubKeyRaw.slice(33, 65));

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d: vapidPrivateKey,
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert from DER to raw r||s format (Web Crypto returns raw for ECDSA)
  const sigB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  const token = `${unsignedToken}.${sigB64}`;
  const keyB64 = uint8ArrayToBase64Url(pubKeyRaw);

  return {
    authorization: `vapid t=${token}, k=${keyB64}`,
  };
}

async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const userPublicKeyRaw = base64UrlToUint8Array(p256dh);
  const userAuth = base64UrlToUint8Array(auth);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import user's public key
  const userPublicKey = await crypto.subtle.importKey(
    "raw",
    userPublicKeyRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive encryption key and nonce
  const encoder = new TextEncoder();

  // auth_info = "WebPush: info\0" + ua_public + as_public
  const authInfo = new Uint8Array([
    ...encoder.encode("WebPush: info\0"),
    ...userPublicKeyRaw,
    ...localPublicKeyRaw,
  ]);

  // PRK = HKDF-Extract(auth, shared_secret)
  const authKey = await crypto.subtle.importKey("raw", userAuth, { name: "HKDF" }, false, [
    "deriveBits",
  ]);
  const ikm = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: authInfo },
    authKey,
    256
  );

  const prkKey = await crypto.subtle.importKey("raw", new Uint8Array(ikm), { name: "HKDF" }, false, [
    "deriveBits",
  ]);

  // CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
    prkKey,
    128
  );

  // Nonce = HKDF-Expand(PRK, "Content-Encoding: nonce\0", 12)
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
    prkKey,
    96
  );

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(cekBits),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding delimiter
  const paddedPayload = new Uint8Array([...encoder.encode(payload), 2]);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(nonceBits) },
    aesKey,
    paddedPayload
  );

  // Build aes128gcm content coding header
  // salt (16) + rs (4) + idlen (1) + keyid (65)
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  header.set(salt, 0);
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = localPublicKeyRaw.length;
  header.set(localPublicKeyRaw, 21);

  const body = new Uint8Array(header.length + new Uint8Array(encryptedBuffer).length);
  body.set(header, 0);
  body.set(new Uint8Array(encryptedBuffer), header.length);

  return { encrypted: body, salt, localPublicKey: localPublicKeyRaw };
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payloadObj: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
) {
  const payloadStr = JSON.stringify(payloadObj);

  const { authorization } = await createVapidAuthHeader(
    subscription.endpoint,
    vapidPublicKey,
    vapidPrivateKey,
    subject
  );

  const { encrypted } = await encryptPayload(payloadStr, subscription.p256dh, subscription.auth);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: encrypted,
  });

  if (!response.ok && response.status === 410) {
    // Subscription expired, should be removed
    return { success: false, expired: true };
  }

  return { success: response.ok, status: response.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, body, icon, data, category } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "user_id, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification preferences
    if (category) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (prefs) {
        // Check category preference
        const categoryMap: Record<string, string> = {
          new_match: "new_matches",
          new_message: "new_messages",
          virtual_gift: "virtual_gifts",
          super_like: "super_likes",
          profile_activity: "profile_activity",
          subscription: "subscription_reminders",
          daily: "daily_reminders",
        };

        const prefKey = categoryMap[category];
        if (prefKey && prefs[prefKey] === false) {
          return new Response(
            JSON.stringify({ sent: false, reason: "disabled_by_user" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check DND
        if (prefs.dnd_enabled && prefs.dnd_start && prefs.dnd_end) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const [startH, startM] = prefs.dnd_start.split(":").map(Number);
          const [endH, endM] = prefs.dnd_end.split(":").map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          let inDnd = false;
          if (startMinutes > endMinutes) {
            // Crosses midnight (e.g., 23:00 - 08:00)
            inDnd = currentMinutes >= startMinutes || currentMinutes < endMinutes;
          } else {
            inDnd = currentMinutes >= startMinutes && currentMinutes < endMinutes;
          }

          if (inDnd) {
            return new Response(
              JSON.stringify({ sent: false, reason: "dnd_active" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // Get push subscriptions for user
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: false, reason: "no_subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = { title, body, icon: icon || "/favicon.ico", data: data || {} };
    const results = [];

    for (const sub of subscriptions) {
      try {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          "mailto:GapRomanceSupport@proton.me"
        );

        if (result.expired) {
          // Clean up expired subscription
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }

        results.push(result);
      } catch (e) {
        console.error("Push send error:", e);
        results.push({ success: false, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ sent: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
