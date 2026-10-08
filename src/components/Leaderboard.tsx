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
    <section dir="rtl" className="border-b border-border py-4">
      <h2 className="text-sm font-bold text-foreground">
        لوحة الصدارة الملكية · 24 ساعة
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {top.data.map((r, i) => (
          <Link
            key={r.id}
            to="/u/$username"
            params={{ username: r.username }}
            className={`relative rounded-lg border p-3 text-center ${
              i === 0
                ? "border-royal/60 bg-royal/10"
                : "border-border bg-secondary/40"
            }`}
          >
            {i === 0 && (
              <Crown className="crown-bounce absolute -top-4 left-1/2 h-7 w-7 -translate-x-1/2 fill-royal text-royal" />
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

      <p className="mt-4 rounded-lg border border-royal/30 bg-royal/5 p-3 text-center text-xs font-bold leading-relaxed text-royal">
        {king.display_name || king.username} — هذا ملك الـ 24 ساعة اليوم! هذا سلطان اليوم!
        كن مثله في اليوم التالي!
      </p>
    </section>
  );
}
