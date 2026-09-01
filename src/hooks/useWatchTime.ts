import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

/**
 * Counts only *real* browsing time: the tab must be visible and the user must
 * have interacted (scroll/click/touch/key) within the last 60 seconds.
 * Idle tabs left open are not credited.
 */
export function useWatchTime() {
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;
    let lastInteraction = Date.now();
    let pending = 0;

    const touch = () => {
      lastInteraction = Date.now();
    };
    const events = ["scroll", "click", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    const tick = window.setInterval(() => {
      const active =
        document.visibilityState === "visible" && Date.now() - lastInteraction < 60_000;
      if (active) pending += 10;
      if (pending >= 60) {
        const seconds = pending;
        pending = 0;
        void supabase.rpc("record_watch_time", { _seconds: seconds });
      }
    }, 10_000);

    return () => {
      window.clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, touch));
      if (pending > 0) void supabase.rpc("record_watch_time", { _seconds: pending });
    };
  }, [user]);
}
