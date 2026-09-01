/** Stable-ish device fingerprint used only by the anti-fraud check on signup. */
export function deviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(window.devicePixelRatio),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency ?? 0),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < parts.length; i += 1) {
    hash = (hash * 31 + parts.charCodeAt(i)) | 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

const REF_KEY = "neon_ref_code";

/** Stores ?ref=CODE so the reward survives until the visitor signs up. */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("ref");
  if (code) localStorage.setItem(REF_KEY, code.trim().toUpperCase());
}

export function storedReferralCode() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REF_KEY) ?? "";
}

export function clearReferralCode() {
  if (typeof window !== "undefined") localStorage.removeItem(REF_KEY);
}
