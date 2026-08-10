import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, LogOut, BarChart3, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/useSession";
import { BottomNav } from "@/components/BottomNav";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useNotificationAlerts } from "@/hooks/useNotificationAlerts";
import { SettingsMenu } from "@/components/SettingsMenu";
import { TextPostFab } from "@/components/TextPostFab";
import { Mascot } from "@/components/Mascot";

export const PLATFORM_NAME = "منصة حجر الجاديت الإمبراطوري";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  usePresenceHeartbeat();
  useNotificationAlerts();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-[#18191a]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Link to="/" className="min-w-0 flex-1">
              <span className="neon-text block text-[15px] font-black leading-tight tracking-tight">
                {PLATFORM_NAME}
              </span>
            </Link>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/notifications" aria-label="الإشعارات">
                <Bell className="h-4 w-4 text-destructive" />
              </Link>
            </Button>
            <SettingsMenu />
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/earnings" aria-label="تحقيق الشروط">
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={signOut}
                aria-label="خروج"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild size="sm" className="rounded-full font-bold">
                <Link to="/auth">دخول</Link>
              </Button>
            )}
          </div>

          <form
            dir="rtl"
            className="mt-2 flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/friends" });
            }}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في المنصة"
              className="h-8 border-0 bg-transparent p-0 text-base focus-visible:ring-0"
            />
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>
      <Mascot />
      <TextPostFab />
      <BottomNav />
    </div>
  );
}
