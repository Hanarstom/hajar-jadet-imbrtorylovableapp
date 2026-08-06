import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Layout } from "@/components/Layout";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { Stories } from "@/components/Stories";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon — Live Creator Feed for Reels & Shorts" },
      {
        name: "description",
        content:
          "Neon is a live social feed where creators post text, hashtags and YouTube Shorts, follow each other and track views.",
      },
      { property: "og:title", content: "Neon — Live Creator Feed" },
      {
        property: "og:description",
        content: "Post, follow and comment on the Neon creator feed.",
      },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [term, setTerm] = useState("");

  const feed = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, user_id, content, hashtags, video_url, created_at, profiles(username, display_name, avatar_url)",
        )
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

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to publish");
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        hashtags: hashtags.trim(),
        video_url: videoUrl.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setHashtags("");
      setVideoUrl("");
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: Error) => toast.error(e.message),
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

        {user ? (
          <form
            className="glass space-y-2 rounded-2xl p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (content.trim() || videoUrl.trim()) publish.mutate();
            }}
          >
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              maxLength={1000}
            />
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#neon #shorts"
              maxLength={200}
            />
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube or Shorts link (optional)"
              maxLength={300}
            />
            <Button type="submit" disabled={publish.isPending}>
              Publish
            </Button>
          </form>
        ) : (
          <div className="glass rounded-2xl p-4 text-sm">
            <Link to="/auth" className="text-primary underline">
              Sign in
            </Link>{" "}
            to publish posts, follow creators and comment.
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
          <p className="text-sm text-muted-foreground">No posts yet — be the first.</p>
        )}
      </div>
    </Layout>
  );
}
