import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Trash2, MessageCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { Comments } from "@/components/Comments";
import { Reactions } from "@/components/Reactions";
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
  unlocked = false,
}: {
  post: FeedPost;
  currentUserId?: string | undefined;
  /** When true the video plays inline with no blur or overlay button (Reels). */
  unlocked?: boolean;
}) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const videoId = extractYouTubeId(post.video_url);

  const removePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["reels"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
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
          <Avatar
            src={post.profiles?.avatar_url}
            name={post.profiles?.display_name}
            className="h-9 w-9 text-sm"
          />
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

      {videoId &&
        (unlocked ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`}
              title={post.content || "Reel"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="aspect-[9/16] w-full"
            />
          </div>
        ) : (
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
        ))}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Reactions postId={post.id} currentUserId={currentUserId} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageCircle className="h-4 w-4" /> التعليقات
          </button>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </div>

      {showComments && <Comments postId={post.id} currentUserId={currentUserId} />}
    </article>
  );
}
