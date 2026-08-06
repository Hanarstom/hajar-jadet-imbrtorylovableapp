import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Users, Clock, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { useSession } from "@/hooks/useSession";
import { formatCount } from "@/lib/neon";
import { cropToSquare, uploadMedia, useMediaUrl } from "@/lib/media";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl px-3 py-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="neon-text mt-1.5 text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function ProfileView({ username }: { username: string }) {
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

  if (profile.isLoading)
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;

  if (!profile.data)
    return (
      <p className="text-sm text-muted-foreground">No creator found for @{username}.</p>
    );

  const p = profile.data;

  return (
    <div className="space-y-4">
      <section className="glass relative overflow-hidden rounded-3xl p-6 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto h-28 w-28">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl" />
          <span className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-2 border-primary/60 bg-secondary text-3xl font-black shadow-neon">
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
        </div>

        <h1 className="mt-4 truncate text-2xl font-black tracking-tight">
          {p.display_name || p.username}
        </h1>
        <p className="text-sm text-primary/80">@{p.username}</p>
        {p.bio && (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {p.bio}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatTile icon={Users} label="Followers" value={formatCount(followers.data ?? 0)} />
          <StatTile
            icon={Eye}
            label="Total Views"
            value={formatCount(Number(p.total_views ?? 0))}
          />
          <StatTile
            icon={Clock}
            label="Watch Hours"
            value={formatCount(Number(p.watch_hours ?? 0))}
          />
        </div>

        {user && user.id !== p.id && (
          <Button
            className="mt-5 w-full rounded-xl font-bold shadow-neon"
            variant={isFollowing.data ? "secondary" : "default"}
            onClick={() => toggleFollow.mutate()}
            disabled={toggleFollow.isPending}
          >
            {isFollowing.data ? "Unfollow" : "متابعة · Follow"}
          </Button>
        )}
      </section>

      {posts.data?.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={user?.id} />
      ))}
      {posts.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No posts yet.</p>
      )}
    </div>
  );
}
