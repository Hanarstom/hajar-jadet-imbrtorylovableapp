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

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
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

  return (
    <Layout>
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6" dir="rtl">
        <h1 className="text-xl font-bold">كلمة مرور جديدة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "اختر كلمة مرور جديدة لحسابك"
            : "افتح هذه الصفحة من الرابط الذي وصلك على بريدك الإلكتروني"}
        </p>
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
          <Button type="submit" className="w-full" disabled={busy || !ready}>
            تحديث كلمة المرور
          </Button>
        </form>
      </div>
    </Layout>
  );
}
