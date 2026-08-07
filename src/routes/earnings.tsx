import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/Layout";
import { useSession } from "@/hooks/useSession";
import { formatCount } from "@/lib/neon";

const LEVELS = [
  { name: "المستوى الأول", followers: 400, watchHours: 200, views: 200_000 },
  { name: "المستوى الثاني", followers: 700, watchHours: 400, views: 500_000 },
] as const;

export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title: "تحقيق الشروط — Neon Monetization Levels" },
      {
        name: "description",
        content:
          "Track both Neon monetization levels: 400 followers / 200 hours / 200K views, then 700 followers / 400 hours / 500K views.",
      },
      { property: "og:title", content: "Neon Monetization Levels" },
      {
        property: "og:description",
        content: "Two-level follower, watch-hour and view goals for Neon creator payouts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Earnings,
});

function StatRow({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm">
          <strong className="neon-text">{formatCount(value)}</strong> / {formatCount(goal)}
        </span>
      </div>
      <Progress value={pct} className="mt-2" />
    </div>
  );
}

function Earnings() {
  const { user, loading } = useSession();

  const stats = useQuery({
    queryKey: ["my-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: profile, error: pe }, { count, error: fe }] = await Promise.all([
        supabase
          .from("profiles")
          .select("total_views, watch_hours")
          .eq("id", user!.id)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", user!.id),
      ]);
      if (pe) throw pe;
      if (fe) throw fe;
      return {
        views: Number(profile?.total_views ?? 0),
        watchHours: Number(profile?.watch_hours ?? 0),
        followers: count ?? 0,
      };
    },
  });

  if (!user && !loading)
    return (
      <Layout>
        <p className="text-sm">
          <Link to="/auth" className="text-primary underline">
            سجّل الدخول
          </Link>{" "}
          لعرض شروط التحقيق.
        </p>
      </Layout>
    );

  const s = stats.data ?? { views: 0, watchHours: 0, followers: 0 };
  const passed = (lvl: (typeof LEVELS)[number]) =>
    s.followers >= lvl.followers && s.watchHours >= lvl.watchHours && s.views >= lvl.views;
  const eligible = passed(LEVELS[1]);

  return (
    <Layout>
      <div dir="rtl" className="space-y-4">
        <section className="glass rounded-3xl p-5 text-center">
          <h1 className="neon-text text-xl font-black leading-relaxed">
            اصنع العزيمة لا تيأس فحلمك قريب
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            قسم تحقيق الشروط — تابع تقدمك في المستويين.
          </p>
        </section>

        {LEVELS.map((lvl, i) => (
          <section key={lvl.name} className="glass rounded-3xl p-4">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black">
                <Trophy
                  className={`h-4 w-4 ${passed(lvl) ? "text-primary" : "text-muted-foreground"}`}
                />
                {lvl.name}
              </h2>
              <span className="text-[11px] font-bold text-muted-foreground">
                {passed(lvl) ? "مكتمل ✅" : `المرحلة ${i + 1}`}
              </span>
            </header>
            <div className="space-y-2">
              <StatRow label="المشتركين" value={s.followers} goal={lvl.followers} />
              <StatRow label="ساعات المشاهدة" value={s.watchHours} goal={lvl.watchHours} />
              <StatRow label="المشاهدات" value={s.views} goal={lvl.views} />
            </div>
          </section>
        ))}

        <div className="glass rounded-2xl p-4">
          <Button className="w-full font-bold" disabled={!eligible}>
            <Lock className="mr-1 h-4 w-4" />
            السحب عبر Binance / PayPal
          </Button>
          {!eligible && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              مقفل حتى إكمال المستوى الثاني.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
