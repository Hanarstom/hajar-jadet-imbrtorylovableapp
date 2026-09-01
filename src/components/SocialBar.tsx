import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const SOCIAL_BAR_SRC = "https://profitableratecpmnetwork.com";

/**
 * Adsterra Social Bar, mounted in a slim strip just above the bottom nav so it
 * never covers reels or interaction buttons. Dismissible per session.
 */
export function SocialBar() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || closed || host.dataset["loaded"] === "1") return;
    host.dataset["loaded"] = "1";
    const el = document.createElement("script");
    el.src = SOCIAL_BAR_SRC;
    el.async = true;
    host.appendChild(el);
  }, [closed]);

  if (closed) return null;

  return (
    <div
      dir="rtl"
      className="pointer-events-auto fixed inset-x-0 bottom-[68px] z-20 mx-auto flex max-w-2xl items-center justify-between gap-2 border-y border-primary/15 bg-background/85 px-3 py-1 backdrop-blur-md"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div ref={hostRef} className="min-h-[22px] flex-1 overflow-hidden" />
      <button
        type="button"
        aria-label="إغلاق الشريط"
        onClick={() => setClosed(true)}
        className="shrink-0 rounded-full p-1 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
