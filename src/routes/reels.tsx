import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { POST_SELECT, type FeedPost } from "@/components/PostCard";
import { ReelGrid } from "@/components/ReelGrid";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { useSession } from "@/hooks/useSession";

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
  const { user } = useSession();

  const reels = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
  });

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          الريلز · Reels
        </h1>
        <SponsoredSlot id="reels-top" />
        {reels.isLoading && <p className="text-sm text-muted-foreground">Loading reels…</p>}
        {Array.from(
          { length: Math.ceil((reels.data?.length ?? 0) / 6) },
          (_, chunk) => (
            <div key={chunk} className="space-y-4">
              <ReelGrid posts={(reels.data ?? []).slice(chunk * 6, chunk * 6 + 6)} />
              <SponsoredSlot id={`reels-${chunk}`} />
            </div>
          ),
        )}
        {reels.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No reels posted yet.</p>
        )}
      </div>
    </Layout>
  );
}
