import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Film, Users, Bell, User, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const TABS = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/reels", label: "الريلز", Icon: Film },
  { to: "/invite", label: "ادعُ واكسب", Icon: DollarSign },
  { to: "/friends", label: "الأصدقاء", Icon: Users },
  { to: "/notifications", label: "الإشعارات", Icon: Bell },
  { to: "/profile", label: "البروفايل", Icon: User },
] as const;

export function BottomNav() {
  const { user } = useSession();

  const unread = useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <nav
      dir="rtl"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-primary/15 bg-background/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="min-w-0">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 px-1 py-2.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-data-[status=active]:drop-shadow-[0_0_10px_var(--primary)] ${
                    to === "/notifications" && (unread.data ?? 0) > 0
                      ? "text-destructive"
                      : ""
                  }`}
                />
                {to === "/notifications" && (unread.data ?? 0) > 0 && (
                  <span className="absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-black text-destructive-foreground">
                    {unread.data}
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[11px] font-semibold leading-none">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
