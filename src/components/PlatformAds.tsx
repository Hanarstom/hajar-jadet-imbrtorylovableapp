import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type PlatformAd = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  created_at: string;
};

export function usePlatformAds() {
  return useQuery({
    queryKey: ["platform-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_ads")
        .select("id, title, body, link_url, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as PlatformAd[];
    },
  });
}

/** Announcements published from the private admin section. */
export function PlatformAds() {
  const ads = usePlatformAds();
  if (!ads.data || ads.data.length === 0) return null;

  return (
    <div dir="rtl" className="space-y-2">
      {ads.data.map((ad) => (
        <article key={ad.id} className="glass rounded-2xl border border-primary/25 p-4">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Megaphone className="h-3.5 w-3.5" /> إعلان الإدارة
          </p>
          {ad.title && <h3 className="mt-1.5 text-sm font-black">{ad.title}</h3>}
          {ad.body && <p className="mt-1 whitespace-pre-wrap text-sm">{ad.body}</p>}
          {ad.link_url && (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-bold text-primary underline"
            >
              فتح الرابط
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
