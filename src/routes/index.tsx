import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { PostCard, POST_SELECT, type FeedPost } from "@/components/PostCard";
import { ReelComposer } from "@/components/ReelComposer";
import { Leaderboard } from "@/components/Leaderboard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { Stories } from "@/components/Stories";
import { RollingEmoji } from "@/components/RollingEmoji";
import { PlatformAds } from "@/components/PlatformAds";
import { useSession } from "@/hooks/useSession";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";

const FEED_PAGE_SIZE = 8;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة حجر الجاديت الإمبراطوري — ريلز عمودية" },
      {
        name: "description",
        content:
          "منصة حجر الجاديت الإمبراطوري: انشر ريلز يوتيوب وإنستغرام وفيسبوك وتيك توك، تابع صانعي المحتوى، وتابع مشاهداتك الحقيقية.",
      },
      { property: "og:title", content: "منصة حجر الجاديت الإمبراطوري" },
      {
        property: "og:description",
        content: "ريلز عمودية، تفاعلات، قصص، ولوحة صدارة كل 24 ساعة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { user } = useSession();
  const [composing, setComposing] = useState(false);

  const me = useQuery({
    queryKey: ["me-avatar", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    // Keep other members' new posts visible even when this feed is already open.
    refetchInterval: 10_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + FEED_PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === FEED_PAGE_SIZE ? pages.length * FEED_PAGE_SIZE : undefined,
  });
  const feedPosts = feed.data?.pages.flat() ?? [];

  return (
    <Layout>
      <div className="space-y-4">
        <RollingEmoji />

        <Leaderboard />

        {user ? (
          <div className="glass rounded-2xl p-3">
            <button
              type="button"
              dir="rtl"
              onClick={() => setComposing((v) => !v)}
              className="flex w-full items-center gap-3"
            >
              <Avatar
                src={me.data?.avatar_url}
                name={me.data?.display_name}
                className="h-10 w-10 shrink-0 text-sm"
              />
              <span className="flex-1 rounded-full bg-secondary/70 px-4 py-2.5 text-right text-sm text-muted-foreground">
                بم تفكر؟
              </span>
            </button>
            {composing && (
              <div className="mt-3 border-t border-border pt-3">
                <ReelComposer userId={user.id} />
              </div>
            )}
          </div>
        ) : (
          <div dir="rtl" className="glass rounded-2xl p-4 text-sm">
            <Link to="/auth" className="text-primary underline">
              سجّل الدخول
            </Link>{" "}
            لنشر الريلز، متابعة صانعي المحتوى والتعليق.
          </div>
        )}

        <Stories />

        <PlatformAds />

        <SponsoredSlot id="feed-top" />

        {feed.isLoading && <p className="text-sm text-muted-foreground">جارٍ تحميل الريلز…</p>}
        {feedPosts.map((post, i) => (
          <div key={post.id} className="space-y-4">
            <PostCard post={post} currentUserId={user?.id} />
            <SponsoredSlot id={`feed-${i}`} />
          </div>
        ))}
        {feedPosts.length === 0 && !feed.isLoading && (
          <p className="text-sm text-muted-foreground">لا ريلز بعد — كن الأول.</p>
        )}
        <InfiniteScrollTrigger
          hasMore={!!feed.hasNextPage}
          loading={feed.isFetchingNextPage}
          onLoadMore={() => void feed.fetchNextPage()}
        />
      </div>
    </Layout>
  );
}
