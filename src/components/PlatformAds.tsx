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
    <div dir="rtl" className="divide-y divide-border">
      {ads.data.map((ad) => (
        <article key={ad.id} className="relative border-b border-border py-5 pe-14">
          <p className="flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="absolute right-0 top-5 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"><Megaphone className="h-5 w-5" /></span> إعلان الإدارة
          </p>
          {ad.title && <h3 className="mt-2 text-base font-bold">{ad.title}</h3>}
          {ad.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{ad.body}</p>}
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
