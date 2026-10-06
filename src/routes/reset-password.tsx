import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور — Neon" },
      {
        name: "description",
        content: "اختر كلمة مرور جديدة لحسابك في منصة Neon واستعد الدخول إلى حسابك القديم.",
      },
      { property: "og:title", content: "إعادة تعيين كلمة المرور — Neon" },
      {
        property: "og:description",
        content: "اختر كلمة مرور جديدة لحسابك في منصة Neon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

// Capture the link tokens before the auth client strips them from the address bar.
const INITIAL_URL = typeof window !== "undefined" ? window.location.href : "";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState(false);
  const [email, setEmail] = useState("");

  async function waitForSession(ms: number) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      const { data } = await supabase.auth.getSession();
      if (data.session) return true;
      await new Promise((r) => setTimeout(r, 300));
    }
    return false;
  }

  async function ensureSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    const href = INITIAL_URL || window.location.href;
    const url = new URL(href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash") || hash.get("token_hash");
    const access = hash.get("access_token");
    const refresh = hash.get("refresh_token");
    try {
      if (access && refresh) {
        const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
        if (!error) return true;
      }
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return true;
      }
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (!error) return true;
      }
    } catch {
      /* ignore */
    }
    // The auth client may still be processing the link in the background.
    return waitForSession(4000);
  }

  useEffect(() => {
    const url = new URL(INITIAL_URL || window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    if (hash.get("error_code") || hash.get("error") || url.searchParams.get("error_code")) {
      setLinkError(true);
    }
    ensureSession().then((ok) => {
      if (ok) setReady(true);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const ok = await ensureSession();
      if (!ok) throw new Error("انتهت صلاحية الرابط. اطلب رابطًا جديدًا من صفحة الدخول «نسيت كلمة المرور».");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("تم تحديث كلمة المرور بنجاح");
      navigate({ to: "/" });
    } catch (err) {
      const msg = (err as Error).message.toLowerCase();
      toast.error(
        msg.includes("weak") || msg.includes("pwned")
          ? "كلمة المرور ضعيفة أو مسربة، اختر واحدة أقوى"
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.replace(/\s+/g, "").toLowerCase();
    if (!clean) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("أرسلنا رابطًا جديدًا. افتحه مرة واحدة فقط وفي نفس المتصفح.");
    } catch (err) {
      const m = (err as Error).message.toLowerCase();
      toast.error(
        m.includes("rate") || m.includes("seconds")
          ? "انتظر دقيقة قبل طلب رابط جديد"
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6" dir="rtl">
        <h1 className="text-xl font-bold">كلمة مرور جديدة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "اختر كلمة مرور جديدة لحسابك"
            : checking
              ? "جارٍ التحقق من الرابط…"
              : "افتح هذه الصفحة من الرابط الذي وصلك على بريدك الإلكتروني"}
        </p>
        {!ready && !checking && linkError && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            هذا الرابط استُخدم من قبل أو انتهت صلاحيته. كل رابط يعمل مرة واحدة فقط. اطلب رابطًا جديدًا
            من هنا، وافتحه مرة واحدة فقط.
          </p>
        )}
        {ready || checking ? (
          <form className="mt-5 space-y-3" onSubmit={submit}>
            <div>
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || checking}>
              تحديث كلمة المرور
            </Button>
          </form>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={resend}>
            <div>
              <Label htmlFor="reset-email">بريدك الإلكتروني</Label>
              <Input
                id="reset-email"
                type="email"
                required
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              أرسل رابطًا جديدًا
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
}
