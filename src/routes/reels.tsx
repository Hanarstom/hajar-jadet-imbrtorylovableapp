import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Reels — YouTube Shorts on Neon" },
      {
        name: "description",
        content:
          "Watch the newest YouTube Shorts reels shared by Neon creators, unlocked one tap at a time.",
      },
      { property: "og:title", content: "Neon Reels" },
      {
        property: "og:description",
        content: "Vertical Shorts reels from the Neon creator community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reels,
});

function Reels() {
  const { user } = useSession();

  const reels = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, user_id, content, hashtags, video_url, created_at, profiles(username, display_name, avatar_url)",
        )
        .ilike("video_url", "%/shorts/%")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
  });

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          الريلز · Shorts
        </h1>
        <SponsoredSlot id="reels-top" />
        {reels.isLoading && <p className="text-sm text-muted-foreground">Loading reels…</p>}
        {reels.data?.map((post, i) => (
          <div key={post.id} className="space-y-4">
            <PostCard post={post} currentUserId={user?.id} unlocked />
            {(i + 1) % 3 === 0 && <SponsoredSlot id={`reels-${i}`} />}
          </div>
        ))}
        {reels.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No reels posted yet.</p>
        )}
      </div>
    </Layout>
  );
}
