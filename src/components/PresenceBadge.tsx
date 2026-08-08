import { useEffect, useState } from "react";
import { isOnline, leftAgoLabel } from "@/hooks/usePresence";

/** Blue "نشط الآن" chip while active, dark-red "يغادر" chip after leaving. */
export function PresenceBadge({
  lastSeenAt,
  className = "",
}: {
  lastSeenAt: string | null | undefined;
  className?: string;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((v) => v + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const online = isOnline(lastSeenAt);

  return (
    <span
      dir="rtl"
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${className}`}
      style={{ color: online ? "#1d4ed8" : "#8b0000" }}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${online ? "animate-pulse" : ""}`}
        style={{ backgroundColor: online ? "#1d4ed8" : "#8b0000" }}
      />
      {online ? "نشط الآن" : leftAgoLabel(lastSeenAt)}
    </span>
  );
}
