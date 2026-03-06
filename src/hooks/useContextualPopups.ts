import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ContextualTriggers {
  showSevenDayPopup: boolean;
  showWelcomeBackPopup: boolean;
  dismissSevenDay: () => void;
  dismissWelcomeBack: () => void;
  profileViewCounts: Map<string, number>;
  trackProfileView: (profileId: string) => number;
  shouldShowSuperLikePrompt: (profileId: string) => boolean;
}

export function useContextualPopups(): ContextualTriggers {
  const { user, profile, subscriptionTier } = useAuth();
  const isFreeTier = subscriptionTier === "free";
  const [showSevenDayPopup, setShowSevenDayPopup] = useState(false);
  const [showWelcomeBackPopup, setShowWelcomeBackPopup] = useState(false);
  const [profileViewCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user || !profile || !isFreeTier) return;

    // Check 7-day popup
    const sevenDayDismissed = localStorage.getItem(`gap_7day_dismissed_${user.id}`);
    if (!sevenDayDismissed && profile.created_at) {
      const createdAt = new Date(profile.created_at);
      const daysSinceJoin = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceJoin >= 7) {
        setShowSevenDayPopup(true);
      }
    }

    // Check welcome back (3 days inactivity)
    const welcomeBackDismissed = localStorage.getItem(`gap_welcome_dismissed_${user.id}`);
    const lastDismissedDate = welcomeBackDismissed ? new Date(welcomeBackDismissed) : null;
    const shouldShowWelcome = !lastDismissedDate || (Date.now() - lastDismissedDate.getTime()) > 7 * 24 * 60 * 60 * 1000;

    if (shouldShowWelcome && profile.last_active_at) {
      const lastActive = new Date(profile.last_active_at);
      const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActive >= 3) {
        setShowWelcomeBackPopup(true);
      }
    }
  }, [user, profile, isFreeTier]);

  const dismissSevenDay = useCallback(() => {
    if (user) localStorage.setItem(`gap_7day_dismissed_${user.id}`, "true");
    setShowSevenDayPopup(false);
  }, [user]);

  const dismissWelcomeBack = useCallback(() => {
    if (user) localStorage.setItem(`gap_welcome_dismissed_${user.id}`, new Date().toISOString());
    setShowWelcomeBackPopup(false);
  }, [user]);

  const trackProfileView = useCallback((profileId: string): number => {
    const current = profileViewCounts.get(profileId) || 0;
    const next = current + 1;
    profileViewCounts.set(profileId, next);
    return next;
  }, [profileViewCounts]);

  const shouldShowSuperLikePrompt = useCallback((profileId: string): boolean => {
    return (profileViewCounts.get(profileId) || 0) >= 3;
  }, [profileViewCounts]);

  return {
    showSevenDayPopup,
    showWelcomeBackPopup,
    dismissSevenDay,
    dismissWelcomeBack,
    profileViewCounts,
    trackProfileView,
    shouldShowSuperLikePrompt,
  };
}
