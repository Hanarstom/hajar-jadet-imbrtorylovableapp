import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Trash2, MessageCircle, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractYouTubeId, openViaDirectLink } from "@/lib/neon";

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  hashtags: string | null;
  video_url: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null } | null;
};

export function PostCard({
  post,
  currentUserId,
}: {
  post: FeedPost;
  currentUserId?: string | undefined;
}) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const videoId = extractYouTubeId(post.video_url);

  const comments = useQuery({
    queryKey: ["comments", post.id],
    enabled: showComments,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, user_id, created_at, profiles(username, display_name)")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Sign in to comment");
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: post.id, user_id: currentUserId, body: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", post.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className="glass glass-hover rounded-2xl p-4">
      <header className="flex items-center justify-between gap-2">
        <Link
          to="/u/$username"
          params={{ username: post.profiles?.username ?? "" }}
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-secondary text-sm font-semibold">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={`${post.profiles.display_name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              (post.profiles?.display_name || "?").charAt(0).toUpperCase()
            )}
          </span>
          <span>
            <span className="block text-sm font-semibold leading-tight">
              {post.profiles?.display_name || "Unknown"}
            </span>
            <span className="block text-xs text-muted-foreground">
              @{post.profiles?.username}
            </span>
          </span>
        </Link>
        {currentUserId === post.user_id && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removePost.mutate()}
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </header>

      {post.content && <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>}
      {post.hashtags && <p className="mt-1 text-sm text-primary">{post.hashtags}</p>}

      {videoId && (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-primary/20">
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt="Locked video preview"
            className="h-56 w-full scale-110 object-cover blur-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-background/55">
            <Button
              className="rounded-full font-bold shadow-neon"
              onClick={() => openViaDirectLink(`https://www.youtube.com/watch?v=${videoId}`)}
            >
              <Play className="mr-1 h-4 w-4" /> Play Video
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="h-4 w-4" /> Comments
        </button>
        <span>{new Date(post.created_at).toLocaleString()}</span>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {comments.data?.map((c) => (
            <p key={c.id} className="text-sm">
              <span className="font-semibold">
                {(c.profiles as { display_name?: string } | null)?.display_name ?? "User"}:
              </span>{" "}
              <span className="text-muted-foreground">{c.body}</span>
            </p>
          ))}
          {comments.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          )}
          {currentUserId && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) addComment.mutate();
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a comment"
                maxLength={500}
              />
              <Button type="submit" size="sm" disabled={addComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
