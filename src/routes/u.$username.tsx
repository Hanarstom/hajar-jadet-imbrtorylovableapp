import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { useSession } from "@/hooks/useSession";
import { formatCount } from "@/lib/neon";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} on Neon — Profile & Reels` },
      {
        name: "description",
        content: `See @${params.username}'s posts, followers count and total reel views on Neon.`,
      },
      { property: "og:title", content: `@${params.username} on Neon` },
      {
        property: "og:description",
        content: `Follow @${params.username} on the Neon creator feed.`,
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useSession();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, total_views, watch_hours")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profileId = profile.data?.id;

  const followers = useQuery({
    queryKey: ["followers", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileId!);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const isFollowing = useQuery({
    queryKey: ["is-following", profileId, user?.id],
    enabled: !!profileId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", profileId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const posts = useQuery({
    queryKey: ["profile-posts", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, user_id, content, hashtags, video_url, created_at, profiles(username, display_name, avatar_url)",
        )
        .eq("user_id", profileId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to follow");
      if (isFollowing.data) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profileId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following", profileId, user?.id] });
      qc.invalidateQueries({ queryKey: ["followers", profileId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile.isLoading) return <Layout>Loading…</Layout>;
  if (!profile.data)
    return (
      <Layout>
        <p className="text-sm text-muted-foreground">No creator found for @{username}.</p>
      </Layout>
    );

  const p = profile.data;

  return (
    <Layout>
      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary text-xl font-bold">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={`${p.display_name} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                (p.display_name || p.username).charAt(0).toUpperCase()
              )}
            </span>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{p.display_name || p.username}</h1>
              <p className="text-sm text-muted-foreground">@{p.username}</p>
              <div className="mt-2 flex gap-5">
                <span className="text-sm">
                  <strong className="neon-text">{formatCount(followers.data ?? 0)}</strong>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </span>
                <span className="text-sm">
                  <strong className="neon-text">{formatCount(Number(p.total_views))}</strong>{" "}
                  <span className="text-muted-foreground">Total Views</span>
                </span>
              </div>
            </div>
            {user && user.id !== p.id && (
              <Button
                variant={isFollowing.data ? "secondary" : "default"}
                onClick={() => toggleFollow.mutate()}
                disabled={toggleFollow.isPending}
              >
                {isFollowing.data ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>
          {p.bio && <p className="mt-3 text-sm text-muted-foreground">{p.bio}</p>}
        </section>

        {posts.data?.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={user?.id} />
        ))}
        {posts.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </Layout>
  );
}
