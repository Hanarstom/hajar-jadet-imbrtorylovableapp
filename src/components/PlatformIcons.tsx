import type { Platform } from "@/lib/neon";

const COMMON = "shrink-0";

export function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${COMMON} ${className}`}>
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8Z"
      />
      <path fill="#fff" d="M9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${COMMON} ${className}`}>
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="35%" stopColor="#FA7E1E" />
          <stop offset="65%" stopColor="#D62976" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  );
}

export function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${COMMON} ${className}`}>
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.3 19v-6h2l.4-2.5h-2.4V9c0-.7.2-1.2 1.2-1.2h1.3V5.6c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.7H8.6V13h2.1v6h2.6Z"
      />
    </svg>
  );
}

export function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${COMMON} ${className}`}>
      <path
        fill="#25F4EE"
        d="M9.3 9.6v2.2a3.2 3.2 0 1 0 2.4 3.1V3h2.1c.1 1 .5 1.9 1.1 2.6v2.3A5.6 5.6 0 0 1 13.8 7v7.9A5.3 5.3 0 1 1 9.3 9.6Z"
      />
      <path
        fill="#FE2C55"
        d="M10.5 8.4v2.2a3.2 3.2 0 1 0 2.4 3.1V1.8H15c.2 1.9 1.7 3.4 3.6 3.6v2.3a5.6 5.6 0 0 1-3.6-1.3v7.3A5.3 5.3 0 1 1 10.5 8.4Z"
      />
    </svg>
  );
}

export function PlatformIcon({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  if (platform === "youtube") return <YouTubeIcon className={className} />;
  if (platform === "instagram") return <InstagramIcon className={className} />;
  if (platform === "facebook") return <FacebookIcon className={className} />;
  return <TikTokIcon className={className} />;
}
