import { Settings, Moon, Sun, MessageCircle } from "lucide-react";
import { Link } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";

/** Settings menu with the dark / light mode switch. */
export function SettingsMenu() {
  const { mode, toggle } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full" aria-label="الإعدادات">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 text-right">
        <DropdownMenuLabel>الإعدادات</DropdownMenuLabel>
        <DropdownMenuItem asChild><Link to="/chat" className="gap-2"><MessageCircle className="h-4 w-4" />المحادثات الخاصة</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={toggle} className="gap-2 font-semibold">
          {mode === "dark" ? (
            <>
              <Sun className="h-4 w-4 text-primary" /> الوضع النهاري
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-primary" /> الوضع الليلي
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
