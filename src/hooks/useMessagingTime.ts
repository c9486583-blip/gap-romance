import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_DAILY_SECONDS = 3600; // 1 hour

interface MessagingTimeState {
  secondsUsed: number;
  bonusSeconds: number;
  hasUnlimited: boolean;
  remainingSeconds: number;
  isTimeUp: boolean;
  loading: boolean;
  formattedRemaining: string;
}

export function useMessagingTime(isActive: boolean) {
  const { user, subscriptionTier } = useAuth();
  const isFreeTier = subscriptionTier === "free";
  const [state, setState] = useState<MessagingTimeState>({
    secondsUsed: 0,
    bonusSeconds: 0,
    hasUnlimited: false,
    remainingSeconds: FREE_DAILY_SECONDS,
    isTimeUp: false,
    loading: true,
    formattedRemaining: "60 minutes remaining today",
  });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localSecondsRef = useRef(0);

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const formatRemaining = (secs: number): string => {
    if (secs <= 0) return "0 minutes remaining";
    const mins = Math.ceil(secs / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return remMins > 0 ? `${hrs}h ${remMins}m remaining today` : `${hrs} hour${hrs > 1 ? "s" : ""} remaining today`;
    }
    return `${mins} minute${mins !== 1 ? "s" : ""} remaining today`;
  };

  const fetchTimeRecord = useCallback(async () => {
    if (!user) return;
    const today = getTodayStr();
    const { data } = await supabase
      .from("messaging_time")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (data) {
      const used = (data as any).seconds_used || 0;
      const bonus = (data as any).bonus_seconds || 0;
      const unlimited = (data as any).has_unlimited || false;
      localSecondsRef.current = used;
      const totalAllowed = FREE_DAILY_SECONDS + bonus;
      const remaining = unlimited ? Infinity : Math.max(0, totalAllowed - used);
      setState({
        secondsUsed: used,
        bonusSeconds: bonus,
        hasUnlimited: unlimited,
        remainingSeconds: remaining,
        isTimeUp: !unlimited && remaining <= 0,
        loading: false,
        formattedRemaining: unlimited ? "Unlimited today" : formatRemaining(remaining),
      });
    } else {
      // Create record
      await supabase.from("messaging_time").insert({
        user_id: user.id,
        date: today,
        seconds_used: 0,
        bonus_seconds: 0,
        has_unlimited: false,
      } as any);
      localSecondsRef.current = 0;
      setState({
        secondsUsed: 0,
        bonusSeconds: 0,
        hasUnlimited: false,
        remainingSeconds: FREE_DAILY_SECONDS,
        isTimeUp: false,
        loading: false,
        formattedRemaining: formatRemaining(FREE_DAILY_SECONDS),
      });
    }
  }, [user]);

  // Tick every second when active + free tier
  useEffect(() => {
    if (!isActive || !isFreeTier || state.hasUnlimited || state.loading) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }

    tickRef.current = setInterval(() => {
      localSecondsRef.current += 1;
      const totalAllowed = FREE_DAILY_SECONDS + state.bonusSeconds;
      const remaining = Math.max(0, totalAllowed - localSecondsRef.current);
      setState((prev) => ({
        ...prev,
        secondsUsed: localSecondsRef.current,
        remainingSeconds: remaining,
        isTimeUp: remaining <= 0,
        formattedRemaining: formatRemaining(remaining),
      }));
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isActive, isFreeTier, state.hasUnlimited, state.bonusSeconds, state.loading]);

  // Save to DB every 30 seconds
  useEffect(() => {
    if (!isActive || !isFreeTier || !user) {
      if (saveRef.current) clearInterval(saveRef.current);
      return;
    }

    const save = async () => {
      const today = getTodayStr();
      await supabase
        .from("messaging_time")
        .update({ seconds_used: localSecondsRef.current, updated_at: new Date().toISOString() } as any)
        .eq("user_id", user.id)
        .eq("date", today);
    };

    saveRef.current = setInterval(save, 30000);
    return () => {
      save(); // save on unmount
      if (saveRef.current) clearInterval(saveRef.current);
    };
  }, [isActive, isFreeTier, user]);

  // Initial fetch
  useEffect(() => {
    if (isFreeTier) {
      fetchTimeRecord();
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        isTimeUp: false,
        remainingSeconds: Infinity,
        formattedRemaining: "",
      }));
    }
  }, [isFreeTier, fetchTimeRecord]);

  const refreshTime = useCallback(() => {
    fetchTimeRecord();
  }, [fetchTimeRecord]);

  return { ...state, isFreeTier, refreshTime };
}
