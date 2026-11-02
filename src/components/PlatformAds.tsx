import { useInfiniteQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { Button } from "@/components/ui/button";

export type PlatformAd = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  created_at: string;
};

export function usePlatformAds() {
  return useInfiniteQuery({
    queryKey: ["platform-ads"],
    initialPageParam: 0,
    refetchInterval: 10_000,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from("platform_ads")
        .select("id, title, body, link_url, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(pageParam, pageParam + 29);
      if (error) throw error;
      return (data ?? []) as PlatformAd[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 30 ? pages.length * 30 : undefined,
  });
}

/** Announcements published from the private admin section. */
export function PlatformAds() {
  const ads = usePlatformAds();
  const publications = ads.data?.pages.flat() ?? [];
  if (ads.isPending) return <p dir="rtl" className="py-6 text-sm text-muted-foreground">جارٍ تحميل منشورات الإدارة…</p>;
  if (ads.isError) return (
    <div dir="rtl" className="space-y-3 py-6">
      <p className="text-sm text-muted-foreground">تعذر تحميل منشورات الإدارة.</p>
      <Button variant="outline" onClick={() => void ads.refetch()}>إعادة المحاولة</Button>
    </div>
  );
  if (publications.length === 0) return <p dir="rtl" className="py-6 text-sm text-muted-foreground">لا توجد منشورات إدارة بعد.</p>;

  return (
    <div dir="rtl" className="divide-y divide-border">
      {publications.map((ad) => (
        <article key={ad.id} className="relative break-words border-b border-border py-5 pe-14">
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
      <InfiniteScrollTrigger
        hasMore={!!ads.hasNextPage}
        loading={ads.isFetchingNextPage}
        onLoadMore={() => void ads.fetchNextPage()}
      />
    </div>
  );
}
