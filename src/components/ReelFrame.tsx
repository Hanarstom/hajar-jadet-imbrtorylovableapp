import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { claimReel, releaseReel, subscribeReel } from "@/lib/videoBus";
import type { Platform } from "@/lib/neon";


/**
 * Single-audio reel player.
 * - The iframe mounts only while this reel is the active one, so scrolling away
 *   fully stops the previous video and its sound.
 * - Instagram embeds get a replay control (and remount on every activation) so a
 *   finished reel can be watched again here instead of pushing the viewer to Instagram.
 */
export function ReelFrame({
  postId,
  embed,
  platform,
  title,
  onVisibleTwoSeconds,
}: {
  postId: string;
  embed: string;
  platform: Platform | null;
  title: string;
  onVisibleTwoSeconds?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const unsub = subscribeReel((id) => setActive(id === postId));
    return () => {
      unsub();
    };
  }, [postId]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          claimReel(postId);
          if (onVisibleTwoSeconds) {
            timer ??= window.setTimeout(() => onVisibleTwoSeconds(), 2000);
          }
        } else {
          releaseReel(postId);
          if (timer) {
            window.clearTimeout(timer);
            timer = undefined;
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      releaseReel(postId);
      if (timer) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Instagram/TikTok embeds sometimes post an "ended" style message — reset on it.
  useEffect(() => {
    if (platform !== "instagram") return;
    function onMsg(e: MessageEvent) {
      const raw = typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      if (/ended|finish|complete/i.test(raw)) setReplayKey((k) => k + 1);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [platform]);

  return (
    <div
      ref={wrapRef}
      className="relative mt-3 overflow-hidden rounded-2xl border border-primary/20"
    >
      {active ? (
        <iframe
          key={`${postId}-${replayKey}`}
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="aspect-[9/16] w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => claimReel(postId)}
          className="grid aspect-[9/16] w-full place-items-center bg-secondary/50"
          aria-label="تشغيل الريل"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full border border-primary/50 bg-background/70 text-primary shadow-neon">
            <Play className="h-7 w-7" />
          </span>
        </button>
      )}

      {platform === "instagram" && active && (
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full border border-primary/40 bg-background/85 px-3 py-1.5 text-xs font-bold text-primary"
        >
          <RotateCcw className="h-4 w-4" /> إعادة التشغيل هنا
        </button>
      )}
    </div>
  );
}
