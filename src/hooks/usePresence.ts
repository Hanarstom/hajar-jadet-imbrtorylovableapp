import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

/** Marks the signed-in user as active while the app is open. */
export function usePresenceHeartbeat() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const beat = () => {
      if (document.visibilityState === "visible") void supabase.rpc("touch_presence");
    };
    const away = () => {
      void supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString(), is_online: false })
        .eq("id", user.id);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
      else away();
    };
    beat();
    const id = window.setInterval(beat, 15_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", away);
    window.addEventListener("beforeunload", away);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", away);
      window.removeEventListener("beforeunload", away);
      away();
    };
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("live-profile-presence")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["feed"] });
          void queryClient.invalidateQueries({ queryKey: ["reels"] });
          void queryClient.invalidateQueries({ queryKey: ["profile"] });
          void queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export const ONLINE_WINDOW_MS = 45 * 1000;

export function isOnline(lastSeenAt: string | null | undefined, online?: boolean) {
  if (!lastSeenAt) return false;
  return online === true && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

/** Arabic "left N ago" label. */
export function leftAgoLabel(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return "غادر الآن";
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed < 60_000) return "غادر الآن";
  const mins = Math.floor(elapsed / 60_000);
  if (mins < 60) return `يغادر · منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `يغادر · منذ ${hours} س`;
  return `يغادر · منذ ${Math.floor(hours / 24)} ي`;
}
