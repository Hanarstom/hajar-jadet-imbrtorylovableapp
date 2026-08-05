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
