import { useEffect } from "react";

/**
 * Adsterra Social Bar.
 *
 * The Social Bar script renders its own floating widget (it injects fixed
 * elements into <body> itself), so we must NOT wrap it in a small container —
 * that produced an empty strip with only a close button.
 *
 * Paste the exact script URL from the Adsterra Social Bar code here. It always
 * looks like: https://pl<id>.profitableratecpmnetwork.com/xx/yy/zz/<hash>.js
 * A bare domain is a website, not a script, and renders nothing.
 */
const SOCIAL_BAR_SRC = "";

const isScriptUrl = (src: string) => /^https:\/\/\S+\.js(\?\S*)?$/.test(src);

export function SocialBar() {
  useEffect(() => {
    if (!isScriptUrl(SOCIAL_BAR_SRC)) return;
    if (document.querySelector('script[data-adsterra-social-bar="1"]')) return;
    const el = document.createElement("script");
    el.src = SOCIAL_BAR_SRC;
    el.async = true;
    el.dataset["adsterraSocialBar"] = "1";
    document.body.appendChild(el);
  }, []);

  return null;
}
