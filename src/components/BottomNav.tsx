import { Link } from "@tanstack/react-router";
import { Home, Clapperboard, Film, Users, User } from "lucide-react";

const TABS = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/videos", label: "الفيديوهات", Icon: Clapperboard },
  { to: "/reels", label: "الريلز", Icon: Film },
  { to: "/friends", label: "الأصدقاء", Icon: Users },
  { to: "/profile", label: "البروفايل", Icon: User },
] as const;

export function BottomNav() {
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
              <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-data-[status=active]:drop-shadow-[0_0_10px_var(--primary)]" />
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
