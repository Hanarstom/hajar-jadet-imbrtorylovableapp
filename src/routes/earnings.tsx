import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/Layout";
import { useSession } from "@/hooks/useSession";
import { formatCount } from "@/lib/neon";

const GOALS = { followers: 700, watchHours: 400, views: 500_000 };

export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title: "Monetization Stats — Neon Creator Earnings" },
      {
        name: "description",
        content:
          "Track your Neon monetization progress: 700 followers, 400 watch hours and 500K views before withdrawing.",
      },
      { property: "og:title", content: "Neon Monetization Stats" },
      {
        property: "og:description",
        content: "Follower, watch-hour and view goals for Neon creator payouts.",
      },
    ],
  }),
  component: Earnings,
});

function StatRow({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm">
          <strong className="neon-text">{formatCount(value)}</strong> / {formatCount(goal)}
        </span>
      </div>
      <Progress value={pct} className="mt-3" />
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
            Sign in
          </Link>{" "}
          to see your monetization stats.
        </p>
      </Layout>
    );

  const s = stats.data ?? { views: 0, watchHours: 0, followers: 0 };
  const eligible =
    s.followers >= GOALS.followers &&
    s.watchHours >= GOALS.watchHours &&
    s.views >= GOALS.views;

  return (
    <Layout>
      <h1 className="text-xl font-bold">Monetization Stats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hit all three goals to unlock withdrawals.
      </p>
      <div className="mt-4 space-y-3">
        <StatRow label="Followers" value={s.followers} goal={GOALS.followers} />
        <StatRow label="Watch hours" value={s.watchHours} goal={GOALS.watchHours} />
        <StatRow label="Total views" value={s.views} goal={GOALS.views} />
      </div>
      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <Button className="w-full" disabled={!eligible}>
          <Lock className="mr-1 h-4 w-4" />
          Withdraw via Binance / PayPal
        </Button>
        {!eligible && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Locked until all goals are reached.
          </p>
        )}
      </div>
    </Layout>
  );
}
