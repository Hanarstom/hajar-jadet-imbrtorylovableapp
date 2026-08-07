import { Link, useNavigate } from "@tanstack/react-router";
import { Zap, LogOut, BarChart3, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { BottomNav } from "@/components/BottomNav";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/12 shadow-neon">
              <Zap className="h-4 w-4 text-primary" />
            </span>
            <span className="neon-text truncate text-lg font-black tracking-tight">Neon</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="relative">
              <Link to="/notifications" aria-label="الإشعارات">
                <Bell className="h-4 w-4 text-destructive" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/earnings" aria-label="Earnings">
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}
