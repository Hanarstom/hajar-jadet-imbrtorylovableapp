import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const HEARTBEAT_MS = 10_000;

function invalidatePresence(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["feed"] });
  void queryClient.invalidateQueries({ queryKey: ["reels"] });
  void queryClient.invalidateQueries({ queryKey: ["profile"] });
  void queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
}

/** Marks the signed-in user as active while the app is open, offline as soon as they leave. */
export function usePresenceHeartbeat() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const beat = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void supabase.rpc("touch_presence");
      }
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
    const id = window.setInterval(beat, HEARTBEAT_MS);

    // Realtime presence channel: instant join/leave signal for everyone watching.
    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => invalidatePresence(queryClient))
      .on("presence", { event: "join" }, () => {
        beat();
        invalidatePresence(queryClient);
      })
      .on("presence", { event: "leave" }, () => invalidatePresence(queryClient))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ at: new Date().toISOString() });
          beat();
        }
      });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", beat);
    window.addEventListener("online", beat);
    window.addEventListener("offline", away);
    window.addEventListener("pagehide", away);
    window.addEventListener("beforeunload", away);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", beat);
      window.removeEventListener("online", beat);
      window.removeEventListener("offline", away);
      window.removeEventListener("pagehide", away);
      window.removeEventListener("beforeunload", away);
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel("live-profile-presence")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => invalidatePresence(queryClient),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export const ONLINE_WINDOW_MS = 30 * 1000;

export function isOnline(lastSeenAt: string | null | undefined, online?: boolean) {
  if (!lastSeenAt) return false;
  return online === true && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

/** Arabic "left" label with precise elapsed time. */
export function leftAgoLabel(lastSeenAt: string | null | undefined) {
  const base = "غادرنا الآن";
  if (!lastSeenAt) return base;
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed < 60_000) return base;
  const mins = Math.floor(elapsed / 60_000);
  if (mins < 60) return `غادر منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `غادر منذ ${hours} س`;
  return `غادر منذ ${Math.floor(hours / 24)} ي`;
}
