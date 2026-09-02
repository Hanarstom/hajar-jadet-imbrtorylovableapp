/**
 * Popunder gating: at most 2 impressions per user per day and never more than
 * one per 12 hours. Tracked entirely in localStorage.
 */
const KEY = "neon_popunder_state";
const MAX_PER_DAY = 2;
const MIN_GAP_MS = 5 * 60 * 60 * 1000;

const POPUNDER_SRC =
  "https://pl30756663.effectivecpmnetwork.com/6d/aa/71/6daa712c225833100012ea546c0ec3e3.js";

type State = { day: string; count: number; last: number };

function read(): State {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as State) : null;
    if (parsed && parsed.day === today) return parsed;
  } catch {
    /* ignore malformed state */
  }
  return { day: today, count: 0, last: 0 };
}

export function canShowPopunder() {
  if (typeof window === "undefined") return false;
  const s = read();
  return s.count < MAX_PER_DAY && Date.now() - s.last >= MIN_GAP_MS;
}

/** Loads the Adsterra popunder script once, only when the daily cap allows it. */
export function maybeShowPopunder() {
  if (!canShowPopunder()) return false;
  const s = read();
  localStorage.setItem(KEY, JSON.stringify({ ...s, count: s.count + 1, last: Date.now() }));
  const el = document.createElement("script");
  el.src = POPUNDER_SRC;
  el.async = true;
  el.dataset["neonPopunder"] = "1";
  document.body.appendChild(el);
  return true;
}
