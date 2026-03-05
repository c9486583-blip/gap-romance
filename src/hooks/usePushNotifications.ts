import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  }, []);

  useEffect(() => {
    if (!isSupported || !user) return;

    // Check existing subscription
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, [isSupported, user]);

  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      return reg;
    } catch (e) {
      console.error("SW registration failed:", e);
      return null;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") return false;

      const reg = await registerServiceWorker();
      if (!reg) return false;

      // Get VAPID public key
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");
      if (vapidError || !vapidData?.publicKey) {
        console.error("Failed to get VAPID key:", vapidError);
        return false;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const sub = subscription.toJSON();
      const p256dh = sub.keys?.p256dh || "";
      const auth = sub.keys?.auth || "";

      // Store subscription in database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint!,
          p256dh,
          auth,
        } as any,
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("Failed to store push subscription:", error);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.error("Push subscription failed:", e);
      return false;
    }
  }, [isSupported, user, registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error("Unsubscribe failed:", e);
    }
  }, [isSupported, user]);

  // Send a push notification to a specific user (used by client for action-based notifications)
  const sendNotification = useCallback(
    async (targetUserId: string, title: string, body: string, category?: string, data?: any) => {
      try {
        await supabase.functions.invoke("send-push", {
          body: { user_id: targetUserId, title, body, category, data },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    },
    []
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendNotification,
  };
}
