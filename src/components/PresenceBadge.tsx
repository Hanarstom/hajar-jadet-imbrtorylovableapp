import { useEffect, useState } from "react";
import { isOnline, leftAgoLabel } from "@/hooks/usePresence";

/** Blue "نشط الآن" chip while active, dark-red "يغادر" chip after leaving. */
export function PresenceBadge({
  lastSeenAt,
  isOnline: onlineFlag,
  className = "",
}: {
  lastSeenAt: string | null | undefined;
  isOnline?: boolean;
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
      className={`inline-flex items-center gap-2 text-sm font-black ${online ? "text-blue-700" : "text-red-800"} ${className}`}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full ${online ? "animate-pulse bg-blue-700" : "bg-red-800"}`}
      />
      {online ? "نشط الآن" : leftAgoLabel(lastSeenAt)}
    </span>
  );
}
