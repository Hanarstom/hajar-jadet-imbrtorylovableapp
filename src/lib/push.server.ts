import { p256 } from "@noble/curves/nist.js";

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Derives stable VAPID keys from the WEB_PUSH_KEY_SEED secret (no external accounts). */
export async function getVapidKeys() {
  const seed = process.env['WEB_PUSH_KEY_SEED'];
  if (!seed) throw new Error("WEB_PUSH_KEY_SEED missing");
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`vapid:${seed}`)),
  );
  const priv = digest;
  const pub = p256.getPublicKey(priv, false);
  return {
    subject: "mailto:admin@hajar-jadet-imbrtorylovableapp.lovable.app",
    publicKey: b64url(pub),
    privateKey: b64url(priv),
  };
}
