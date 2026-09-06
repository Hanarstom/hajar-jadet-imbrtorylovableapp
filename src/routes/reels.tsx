import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { PostCard, POST_SELECT, type FeedPost } from "@/components/PostCard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { useSession } from "@/hooks/useSession";


const REELS_PAGE_SIZE = 9;

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Reels — Shorts, TikTok & Instagram on Neon" },
      {
        name: "description",
        content:
          "Watch the newest vertical reels shared by Neon creators from YouTube Shorts, Instagram, Facebook and TikTok.",
      },
      { property: "og:title", content: "Neon Reels" },
      {
        property: "og:description",
        content: "Vertical reels from the Neon creator community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reels,
});

function Reels() {

  const reels = useInfiniteQuery({
    queryKey: ["reels"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + REELS_PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === REELS_PAGE_SIZE ? pages.length * REELS_PAGE_SIZE : undefined,
  });
  const reelPosts = reels.data?.pages.flat() ?? [];

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          الريلز · Reels
        </h1>
        <SponsoredSlot id="reels-top" />
        {reels.isLoading && <p className="text-sm text-muted-foreground">Loading reels…</p>}
        {Array.from({ length: Math.ceil(reelPosts.length / 3) }, (_, chunk) => (
          <div key={chunk} className="space-y-4">
            <ReelGrid posts={reelPosts.slice(chunk * 3, chunk * 3 + 3)} />
            <SponsoredSlot id={`reels-${chunk}`} />
          </div>
        ))}
        {reelPosts.length === 0 && !reels.isLoading && (
          <p className="text-sm text-muted-foreground">No reels posted yet.</p>
        )}
        <InfiniteScrollTrigger
          hasMore={!!reels.hasNextPage}
          loading={reels.isFetchingNextPage}
          onLoadMore={() => void reels.fetchNextPage()}
        />
      </div>
    </Layout>
  );
}
