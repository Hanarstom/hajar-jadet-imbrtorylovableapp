/** Small interaction feedback helpers: quick sounds, vibration, and OS notifications. */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  void ctx.resume();
  return ctx;
}

function tone(freq: number, duration = 0.12, type: OscillatorType = "sine", gain = 0.06) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ac.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function vibrate(pattern: number | number[] = 25) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

/** Quick pop for the like button. */
export function playLikeSound() {
  tone(660, 0.09, "triangle");
  vibrate(15);
}

/** Playful double blip for the "أضحكني" reaction. */
export function playHahaSound() {
  tone(520, 0.08, "square", 0.05);
  window.setTimeout(() => tone(780, 0.1, "square", 0.05), 90);
  vibrate([12, 40, 18]);
}

export function playReactionSound(type: string) {
  if (type === "haha") return playHahaSound();
  playLikeSound();
}

/** Notification chime + phone buzz. */
export function playNotificationSound() {
  tone(880, 0.12, "sine", 0.07);
  window.setTimeout(() => tone(1180, 0.16, "sine", 0.06), 120);
  vibrate([30, 60, 30]);
}

/** Asks once for OS notification permission (needed for alerts outside the app). */
export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Shows an OS-level notification (lock screen / outside the app when supported). */
export async function showSystemNotification(title: string, body: string) {
  if (!(await ensureNotificationPermission())) return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, icon: "/favicon.ico", tag: "neon-notify" });
      return;
    }
    new Notification(title, { body, icon: "/favicon.ico", tag: "neon-notify" });
  } catch {
    /* ignore */
  }
}
