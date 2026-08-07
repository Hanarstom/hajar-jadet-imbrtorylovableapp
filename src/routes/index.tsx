import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { PostCard, POST_SELECT, type FeedPost } from "@/components/PostCard";
import { ReelComposer } from "@/components/ReelComposer";
import { Leaderboard } from "@/components/Leaderboard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { Stories } from "@/components/Stories";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon — Vertical Reels Feed for Creators" },
      {
        name: "description",
        content:
          "Neon is a vertical reels feed: share YouTube Shorts, Instagram, Facebook and TikTok reels, follow creators and track real views.",
      },
      { property: "og:title", content: "Neon — Vertical Reels Feed" },
      {
        property: "og:description",
        content: "Post reels from YouTube, Instagram, Facebook and TikTok on Neon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { user } = useSession();
  const [term, setTerm] = useState("");

  const feed = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
  });

  const search = useQuery({
    queryKey: ["search", term],
    enabled: term.trim().length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .or(`username.ilike.%${term.trim()}%,display_name.ilike.%${term.trim()}%`)
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Layout>
      <div className="space-y-4">
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-primary" />

            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search creators by name or @username"
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
          {search.data && search.data.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {search.data.map((p) => (
                <li key={p.username}>
                  <Link
                    to="/u/$username"
                    params={{ username: p.username }}
                    className="block rounded-md px-2 py-1 text-sm hover:bg-secondary"
                  >
                    {p.display_name}{" "}
                    <span className="text-muted-foreground">@{p.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Leaderboard />

        {user ? (
          <ReelComposer userId={user.id} />
        ) : (
          <div className="glass rounded-2xl p-4 text-sm">
            <Link to="/auth" className="text-primary underline">
              Sign in
            </Link>{" "}
            to publish reels, follow creators and comment.
          </div>
        )}

        <Stories />

        <SponsoredSlot id="feed-top" />

        {feed.isLoading && <p className="text-sm text-muted-foreground">Loading feed…</p>}
        {feed.data?.map((post, i) => (
          <div key={post.id} className="space-y-4">
            <PostCard post={post} currentUserId={user?.id} />
            {(i + 1) % 3 === 0 && <SponsoredSlot id={`feed-${i}`} />}
          </div>
        ))}
        {feed.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No reels yet — be the first.</p>
        )}
      </div>
    </Layout>
  );
}
