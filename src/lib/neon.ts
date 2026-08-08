export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export type Platform = "youtube" | "instagram" | "facebook" | "tiktok";

export function detectPlatform(url: string | null | undefined): Platform | null {
  if (!url) return null;
  if (/youtu\.?be|youtube\.com/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return null;
}

/** Builds a vertical-reel embed URL for any supported platform. */
export function reelEmbedUrl(url: string | null | undefined): string | null {
  const platform = detectPlatform(url);
  if (!url || !platform) return null;
  if (platform === "youtube") {
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?playsinline=1&rel=0&autoplay=1&mute=1&loop=1&playlist=${id}` : null;
  }
  if (platform === "instagram") {
    const m = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([\w-]+)/i);
    return m?.[1] ? `https://www.instagram.com/reel/${m[1]}/embed` : null;
  }
  if (platform === "tiktok") {
    const m = url.match(/tiktok\.com\/(?:.*\/video\/|v\/|embed\/v2\/)(\d+)/i);
    return m?.[1] ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
  }
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
}

// Placeholder for your Adsterra Direct Link. Replace with the real smartlink URL.
export const ADSTERRA_DIRECT_LINK = "";

export function openViaDirectLink(target: string) {
  if (ADSTERRA_DIRECT_LINK) {
    window.open(ADSTERRA_DIRECT_LINK, "_blank", "noopener");
  }
  window.open(target, "_blank", "noopener");
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
