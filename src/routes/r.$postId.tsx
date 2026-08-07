import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { PostCard, POST_SELECT, type FeedPost } from "@/components/PostCard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/r/$postId")({
  head: () => ({
    meta: [
      { title: "Watch this Reel on Neon" },
      {
        name: "description",
        content: "A vertical reel shared on Neon — watch, react and follow the creator.",
      },
      { property: "og:title", content: "Watch this Reel on Neon" },
      {
        property: "og:description",
        content: "Vertical reels from Instagram, TikTok, Facebook and YouTube on Neon.",
      },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SingleReel,
});

function SingleReel() {
  const { postId } = Route.useParams();
  const { user } = useSession();

  const post = useQuery({
    queryKey: ["reel", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as FeedPost | null;
    },
  });

  return (
    <Layout>
      <div dir="rtl" className="space-y-4">
        {post.isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
        {post.data && <PostCard post={post.data} currentUserId={user?.id} unlocked />}
        {post.data === null && (
          <p className="text-sm text-muted-foreground">هذا الريل غير موجود.</p>
        )}
        <SponsoredSlot id="reel-single" />
      </div>
    </Layout>
  );
}
