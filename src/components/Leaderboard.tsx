import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/Avatar";
import { formatCount } from "@/lib/neon";

type Row = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
};

export function Leaderboard() {
  const top = useQuery({
    queryKey: ["leaderboard-24h"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("leaderboard_24h");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  if (!top.data || top.data.length === 0) return null;
  const king = top.data[0]!;

  return (
    <section dir="rtl" className="glass rounded-3xl p-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        لوحة الصدارة الملكية · 24 ساعة
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {top.data.map((r, i) => (
          <Link
            key={r.id}
            to="/u/$username"
            params={{ username: r.username }}
            className={`relative rounded-2xl border p-3 text-center ${
              i === 0
                ? "border-yellow-400/60 bg-yellow-400/10 shadow-neon"
                : "border-border bg-secondary/40"
            }`}
          >
            {i === 0 && (
              <Crown className="crown-bounce absolute -top-4 left-1/2 h-7 w-7 -translate-x-1/2 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_#facc15]" />
            )}
            <Avatar
              src={r.avatar_url}
              name={r.display_name || r.username}
              className="mx-auto h-12 w-12 text-sm font-bold"
            />
            <p className="mt-2 truncate text-xs font-bold">
              {r.display_name || r.username}
            </p>
            <p className="text-[10px] text-muted-foreground">
              #{i + 1} · {formatCount(Number(r.score))}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-3 text-center text-xs font-bold leading-relaxed text-yellow-300">
        {king.display_name || king.username} — هذا ملك الـ 24 ساعة اليوم! هذا سلطان اليوم!
        كن مثله في اليوم التالي!
      </p>
    </section>
  );
}
