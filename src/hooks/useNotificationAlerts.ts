import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
  ensureNotificationPermission,
  playNotificationSound,
  showSystemNotification,
} from "@/lib/feedback";

type Row = { id: string; type: string; meta: string | null };

const TEXT: Record<string, string> = {
  follow: "قام أحدهم بمتابعتك 🎉",
  comment: "تعليق جديد على الريل الخاص بك 💬",
  reaction: "تفاعل جديد على الريل الخاص بك ❤️",
  avatar: "أحد أصدقائك حدّث صورته الشخصية 🖼️",
  admin: "إعلان جديد من إدارة المنصة 📣",
};

/**
 * Watches unread notifications and fires a sound, a light phone vibration and an
 * OS notification (works on the lock screen where the browser supports it).
 */
export function useNotificationAlerts() {
  const { user } = useSession();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (user) void ensureNotificationPermission();
  }, [user]);

  useQuery({
    queryKey: ["notif-alerts", user?.id],
    enabled: !!user,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, meta")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      const rows = (data ?? []) as Row[];

      if (seen.current === null) {
        seen.current = new Set(rows.map((r) => r.id));
        return rows.length;
      }
      const fresh = rows.filter((r) => !seen.current!.has(r.id));
      fresh.forEach((r) => seen.current!.add(r.id));
      if (fresh.length > 0) {
        playNotificationSound();
        const first = fresh[0]!;
        void showSystemNotification(
          "منصة حجر الجاديت الإمبراطوري",
          TEXT[first.type] ?? "لديك إشعار جديد",
        );
      }
      return rows.length;
    },
  });
}
