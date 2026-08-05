import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { useSession } from "@/hooks/useSession";
import { extractYouTubeId } from "@/lib/neon";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos — Long-Form Creator Clips on Neon" },
      {
        name: "description",
        content:
          "Browse every YouTube video shared on the Neon creator feed, newest uploads first.",
      },
      { property: "og:title", content: "Neon Videos" },
      {
        property: "og:description",
        content: "Long-form YouTube clips posted by Neon creators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Videos,
});

function Videos() {
  const { user } = useSession();

  const videos = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, user_id, content, hashtags, video_url, created_at, profiles(username, display_name, avatar_url)",
        )
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).filter(
        (p) => extractYouTubeId(p.video_url) && !(p.video_url ?? "").includes("/shorts/"),
      ) as unknown as FeedPost[];
    },
  });

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          الفيديوهات · Videos
        </h1>
        <SponsoredSlot id="videos-top" />
        {videos.isLoading && <p className="text-sm text-muted-foreground">Loading videos…</p>}
        {videos.data?.map((post, i) => (
          <div key={post.id} className="space-y-4">
            <PostCard post={post} currentUserId={user?.id} />
            {(i + 1) % 3 === 0 && <SponsoredSlot id={`videos-${i}`} />}
          </div>
        ))}
        {videos.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No videos posted yet.</p>
        )}
      </div>
    </Layout>
  );
}
