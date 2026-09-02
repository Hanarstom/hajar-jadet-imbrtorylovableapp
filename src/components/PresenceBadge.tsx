import { useEffect, useState } from "react";
import { isOnline, leftAgoLabel } from "@/hooks/usePresence";

/** Live green "متصل الآن" chip while active, red "غادر الآن" chip after leaving. */
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
    const id = window.setInterval(() => tick((v) => v + 1), 5_000);
    return () => window.clearInterval(id);
  }, []);

  const online = isOnline(lastSeenAt, onlineFlag);

  return (
    <span
      dir="rtl"
      className={`inline-flex flex-col items-center gap-1 text-center leading-tight ${className}`}
    >
      <span
        className={`inline-flex items-center gap-2 text-base font-black ${online ? "text-emerald-500" : "text-red-600"}`}
      >
        {online ? (
          <span className="inline-block h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_3px_rgba(16,185,129,0.9)]" />
        ) : (
          <span className="inline-block shrink-0 animate-pulse text-lg">❤️</span>
        )}
        {online ? "متصل الآن" : leftAgoLabel(lastSeenAt)}
      </span>
      <span
        className={`text-sm font-bold ${online ? "text-emerald-400" : "text-red-500/90"}`}
      >
        {online ? "أهلين وسهلين، نورتنا والله 🥳🥲" : "غادرنا الآن، الله يسامحه 😂"}
      </span>
    </span>
  );
}
