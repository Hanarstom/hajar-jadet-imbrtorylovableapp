import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { getVapidPublicKey, savePushSubscription } from "@/lib/push.functions";

function toBytes(b64: string) {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function subscribe() {
  const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = await getVapidPublicKey();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toBytes(key),
    });
  }
  const j = sub.toJSON();
  await savePushSubscription({
    data: { endpoint: sub.endpoint, p256dh: j.keys!['p256dh']!, auth: j.keys!['auth']! },
  });
}

/** Phone/background notifications via standard Web Push. */
export function useWebPush() {
  const { user } = useSession();
  const [state, setState] = useState<"unsupported" | "default" | "granted" | "denied">(
    "default",
  );

  useEffect(() => {
    if (!pushSupported()) return setState("unsupported");
    setState(Notification.permission as "default" | "granted" | "denied");
    if (user && Notification.permission === "granted") void subscribe().catch(() => {});
  }, [user]);

  const enable = useCallback(async () => {
    if (!pushSupported()) return false;
    const p = await Notification.requestPermission();
    setState(p as "default" | "granted" | "denied");
    if (p !== "granted") return false;
    await subscribe();
    return true;
  }, []);

  return { state, enable };
}
