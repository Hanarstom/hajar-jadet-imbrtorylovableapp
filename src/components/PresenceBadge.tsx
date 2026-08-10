import { useEffect, useState } from "react";
import { isOnline, leftAgoLabel } from "@/hooks/usePresence";

/** Blue "نشط الآن" chip while active, dark-red "يغادر" chip after leaving. */
export function PresenceBadge({
  lastSeenAt,
  isOnline: onlineFlag,
  className = "",
}: {
  lastSeenAt: string | null | undefined;
  isOnline?: boolean | undefined;
  className?: string;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((v) => v + 1), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const online = isOnline(lastSeenAt, onlineFlag);

  return (
    <span
      dir="rtl"
      className={`inline-flex items-center gap-2 text-base font-black leading-tight ${online ? "text-blue-500" : "text-red-600"} ${className}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full ${online ? "animate-pulse bg-blue-500 shadow-[0_0_10px_3px_rgba(59,130,246,0.9)]" : "bg-red-600 shadow-[0_0_8px_2px_rgba(220,38,38,0.7)]"}`}
      />
      {online ? "اي ها هلق صرت نشيط وانت عيني🥲" : leftAgoLabel(lastSeenAt)}
    </span>
  );
}
