import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

/** Marks the signed-in user as active while the app is open. */
export function usePresenceHeartbeat() {
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;
    const beat = () => {
      if (document.visibilityState === "visible") void supabase.rpc("touch_presence");
    };
    beat();
    const id = window.setInterval(beat, 45_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [user]);
}

export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function isOnline(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

/** Arabic "left N ago" label. */
export function leftAgoLabel(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return "يغادر";
  const mins = Math.max(1, Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60_000));
  if (mins < 60) return `يغادر · منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `يغادر · منذ ${hours} س`;
  return `يغادر · منذ ${Math.floor(hours / 24)} ي`;
}
