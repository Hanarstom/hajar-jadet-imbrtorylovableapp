import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { COUNTRIES } from "@/lib/countries";
import { captureReferralFromUrl, clearReferralCode, deviceFingerprint, storedReferralCode } from "@/lib/fingerprint";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Neon — Creator Social Feed" },
      {
        name: "description",
        content:
          "Create your Neon account to publish posts, share Shorts, follow creators and track your views.",
      },
      { property: "og:title", content: "Sign in to Neon" },
      {
        property: "og:description",
        content: "Join Neon: post, follow creators and track your reel views.",
      },
    ],
  }),
  component: AuthPage,
});

function normalizeEmail(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function arabicAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من كتابتهما بدون مسافات، أو استخدم «نسيت كلمة المرور».";
  if (m.includes("weak") || m.includes("pwned"))
    return "كلمة المرور ضعيفة أو مسربة. اختر كلمة مرور أقوى (أحرف وأرقام ورموز).";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "هذا البريد مسجل بالفعل. سجّل الدخول أو استخدم «نسيت كلمة المرور».";
  if (m.includes("email not confirmed")) return "لم يتم تأكيد البريد بعد.";
  if (m.includes("rate limit")) return "محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  async function resetPassword() {
    const clean = normalizeEmail(email);
    if (!clean) {
      toast.error("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("أرسلنا لك رابط إعادة تعيين كلمة المرور على بريدك");
    } catch (err) {
      toast.error(arabicAuthError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const cleanEmail = normalizeEmail(email);
    try {
      if (mode === "signup") {
        if (!country) throw new Error("اختر بلدك أولاً");
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: username.trim().toLowerCase(),
              display_name: username.trim(),
              country_code: country,
              referral_code: storedReferralCode(),
              device_fingerprint: deviceFingerprint(),
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInError) throw signInError;
        }
        clearReferralCode();
        toast.success("Welcome to Neon");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(arabicAuthError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }


  return (
    <Layout>
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Neon creator network</p>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          {mode === "signup" && (
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={24}
              />
            </div>
          )}
          {mode === "signup" && (
            <div dir="rtl">
              <Label htmlFor="country">البلد (إلزامي)</Label>
              <select
                id="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                <option value="">اختر بلدك…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoCapitalize="none"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        {mode === "login" && (
          <button
            type="button"
            className="mt-3 w-full text-xs text-primary hover:underline"
            onClick={resetPassword}
            disabled={busy}
          >
            نسيت كلمة المرور؟
          </button>
        )}

        <button
          className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "No account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </Layout>
  );
}
