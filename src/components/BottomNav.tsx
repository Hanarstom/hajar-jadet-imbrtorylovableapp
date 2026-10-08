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
      className="bottom-navigation fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-6">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="min-w-0">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center min-h-16 justify-center gap-1.5 px-0.5 py-2.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-data-[status=active]:fill-primary/15 ${
                    to === "/notifications" && (unread.data ?? 0) > 0
                      ? "text-destructive"
                      : to === "/invite"
                        ? "text-primary"
                        : ""
                  }`}
                />
                {to === "/notifications" && (unread.data ?? 0) > 0 && (
                  <span className="absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-black text-destructive-foreground">
                    {unread.data}
                  </span>
                )}
              </span>
              <span
                className={`w-full text-center text-[10px] leading-normal sm:text-xs ${to === "/invite" ? "font-bold text-primary" : "font-semibold"}`}
              >
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
