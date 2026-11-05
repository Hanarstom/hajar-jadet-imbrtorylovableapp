export const CHAT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
export function messageIsLive(createdAt: string, now = Date.now()) {
  const sent = Date.parse(createdAt);
  return Number.isFinite(sent) && sent + CHAT_RETENTION_MS > now;
}
export function becameOnline(previous: boolean | undefined, current: boolean) {
  return previous === false && current;
}