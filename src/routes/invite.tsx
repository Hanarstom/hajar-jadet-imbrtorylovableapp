import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gift, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { PresenceBadge } from "@/components/PresenceBadge";
import { useSession } from "@/hooks/useSession";
import { countryFlag, countryName } from "@/lib/countries";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "ادعُ صديقًا واكسب أموالًا — منصة حجر الجاديت" },
      {
        name: "description",
        content:
          "شارك رابط دعوتك واكسب 0.01$ عند تسجيل صديق و0.04$ إضافية عند نشاطه اليومي، والسحب عبر Binance من 10$.",
      },
      { property: "og:title", content: "ادعُ صديقًا واكسب أموالًا" },
      {
        property: "og:description",
        content: "اربح من دعوة أصدقائك على منصة حجر الجاديت الإمبراطوري.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvitePage,
});

type ReferralRow = {
  id: string;
  invited_id: string;
  status: string;
  signup_reward_paid: boolean;
  activity_reward_paid: boolean;
};

function InvitePage() {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const [binanceId, setBinanceId] = useState("");
  const [amount, setAmount] = useState("10");

  const me = useQuery({
    queryKey: ["invite-me", user?.id],
    enabled: !!user,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, country_code")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      const { data: wallet } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", user!.id)
        .maybeSingle();
      return { ...data, balance: wallet?.balance ?? 0 };
    },
  });


  const referrals = useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, invited_id, status, signup_reward_paid, activity_reward_paid")
        .eq("inviter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as ReferralRow[];
      if (rows.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, username, country_code, is_online, last_seen_at")
        .in(
          "id",
          rows.map((r) => r.invited_id),
        );
      return rows.map((r) => ({
        ...r,
        profile: profs?.find((p) => p.id === r.invited_id) ?? null,
      }));
    },
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("request_withdrawal", {
        _amount: Number(amount),
        _binance_id: binanceId,
      });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: (result) => {
      if (result === "ok") {
        toast.success("تم إرسال طلب السحب عبر Binance");
        void queryClient.invalidateQueries({ queryKey: ["invite-me"] });
      } else {
        toast.error(result);
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const balance = Number(me.data?.balance ?? 0);
  const link =
    typeof window !== "undefined" && me.data?.referral_code
      ? `${window.location.origin}/?ref=${me.data.referral_code}`
      : "";

  const shareText = `انضم إلى منصة حجر الجاديت الإمبراطوري واربح معنا! ${link}`;
  const shares = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
    {
      label: "Messenger",
      href: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=0&redirect_uri=${encodeURIComponent(link)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("انضم واربح معنا!")}`,
    },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
    { label: "Instagram", href: "https://www.instagram.com/" },
  ];

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("تم نسخ رابط الدعوة");
  }

  if (!loading && !user) {
    return (
      <Layout>
        <div dir="rtl" className="glass rounded-2xl p-5 text-center">
          <p className="text-base font-bold">سجّل الدخول لتحصل على رابط دعوتك وتبدأ الربح.</p>
          <Button asChild className="mt-3 rounded-full font-bold">
            <Link to="/auth">تسجيل الدخول</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div dir="rtl" className="space-y-4">
        <div className="glass rounded-2xl p-4">
          <h1 className="flex items-center gap-2 text-lg font-black">
            <Gift className="h-5 w-5 text-primary" /> ادعُ صديقًا واكسب أموالًا
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            0.01$ فور تسجيل صديق حقيقي، و0.04$ إضافية عند نشاطه (ريل واحد يوميًا + 30 دقيقة تصفح
            فعلي). المدعو لا يحصل على أموال.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm" dir="ltr">
              {link || "…"}
            </span>
            <Button size="sm" className="rounded-full font-bold" onClick={() => void copy()}>
              <Copy className="me-1 h-4 w-4" /> نسخ
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {shares.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-primary/25 bg-secondary/40 py-2 text-center text-sm font-bold"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="flex items-center gap-2 text-base font-black">
            <Wallet className="h-5 w-5 text-primary" /> رصيدي
          </h2>
          <p className="neon-text mt-1 text-3xl font-black">${balance.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            الحد الأدنى للسحب 10$ — السحب عبر منصة Binance فقط.
          </p>
          <div className="mt-3 space-y-2">
            <Input
              value={binanceId}
              onChange={(e) => setBinanceId(e.target.value)}
              placeholder="معرّف Binance (Binance ID)"
              maxLength={64}
            />
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="المبلغ"
            />
            <Button
              className="w-full rounded-full font-bold"
              disabled={balance < 10 || withdraw.isPending}
              onClick={() => withdraw.mutate()}
            >
              {balance < 10 ? "السحب مقفل حتى 10$" : "طلب السحب عبر Binance"}
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="text-base font-black">تحقيق الربح من خلال الدعوات</h2>
          {referrals.isLoading && <p className="mt-2 text-sm text-muted-foreground">جارٍ التحميل…</p>}
          {referrals.data?.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">لم تدعُ أحدًا بعد — شارك رابطك الآن.</p>
          )}
          <ul className="mt-2 space-y-2">
            {referrals.data?.map((r) => {
              const earned =
                (r.signup_reward_paid ? 0.01 : 0) + (r.activity_reward_paid ? 0.04 : 0);
              return (
                <li key={r.id} className="rounded-2xl border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-bold">
                      {countryFlag(r.profile?.country_code)} {r.profile?.display_name ?? "مستخدم"}
                      <span className="text-muted-foreground"> @{r.profile?.username ?? "—"}</span>
                    </span>
                    <span className="neon-text shrink-0 text-sm font-black">
                      ${earned.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">
                      البلد: {countryName(r.profile?.country_code) || "—"}
                    </span>
                    <span className={r.signup_reward_paid ? "text-primary" : "text-muted-foreground"}>
                      التسجيل:{" "}
                      {r.status === "suspicious"
                        ? "قيد المراجعة (اشتباه)"
                        : r.signup_reward_paid
                          ? "مُوثّق ✔"
                          : "غير مُوثّق"}
                    </span>
                    <span className={r.activity_reward_paid ? "text-primary" : "text-muted-foreground"}>
                      النشاط: {r.activity_reward_paid ? "مكتمل ✔" : "قيد التحقق"}
                    </span>
                  </div>
                  <PresenceBadge
                    className="mt-1 text-sm"
                    lastSeenAt={r.profile?.last_seen_at}
                    isOnline={r.profile?.is_online}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
