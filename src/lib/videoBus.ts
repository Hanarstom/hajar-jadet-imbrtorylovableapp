/**
 * Ensures only one reel player is mounted (and therefore audible) at a time.
 * Any component can claim playback; every other subscriber unmounts its iframe,
 * which fully stops the previous video and its sound.
 */
type Listener = (activeId: string | null) => void;

let activeId: string | null = null;
const listeners = new Set<Listener>();

export function getActiveReel() {
  return activeId;
}

export function claimReel(id: string) {
  if (activeId === id) return;
  activeId = id;
  listeners.forEach((l) => l(activeId));
}

export function releaseReel(id: string) {
  if (activeId !== id) return;
  activeId = null;
  listeners.forEach((l) => l(activeId));
}

export function subscribeReel(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
