import { useEffect, useState } from "react";
import { captureReferralFromUrl } from "@/lib/fingerprint";
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
import { SocialBar } from "@/components/SocialBar";

export const PLATFORM_NAME = "منصة حجر الجاديت الإمبراطوري";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  useEffect(() => captureReferralFromUrl(), []);
  usePresenceHeartbeat();
  useNotificationAlerts();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div dir="rtl" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img src="/icon-192.png" alt="" className="hidden h-9 w-9 shrink-0 rounded-lg sm:block" />
              <span className="block text-[14px] font-bold leading-relaxed text-primary sm:text-lg">
                {PLATFORM_NAME}
              </span>
            </Link>
            <div className="platform-header-tools flex shrink-0 items-center gap-0.5 sm:gap-1">
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
              <Button asChild size="sm" className="rounded-full bg-foreground font-bold text-background hover:bg-foreground/90">
                <Link to="/auth">دخول</Link>
              </Button>
            )}
            </div>
          </div>

          <form
            dir="rtl"
            className="mt-3 flex items-center gap-3 rounded-full border border-border bg-secondary px-4 py-1.5"
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
      <main className="platform-main mx-auto max-w-3xl px-4 pb-44 pt-4 sm:px-6">{children}</main>
      <Mascot />
      <TextPostFab />
      <SocialBar />
      <BottomNav />
    </div>
  );
}
