import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Play,
  Trash2,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Copy,
  Eye,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { Comments } from "@/components/Comments";
import { Reactions } from "@/components/Reactions";
import { PlatformIcon } from "@/components/PlatformIcons";
import {
  detectPlatform,
  extractYouTubeId,
  formatCount,
  openViaDirectLink,
  reelEmbedUrl,
} from "@/lib/neon";

export const POST_SELECT =
  "id, user_id, content, hashtags, video_url, platform, views_count, created_at, profiles(username, display_name, avatar_url, last_seen_at)";

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  hashtags: string | null;
  video_url: string | null;
  platform?: string | null;
  views_count?: number | null;
  created_at: string;
  profiles:
    | { username: string; display_name: string; avatar_url: string | null; last_seen_at?: string | null }
    | null;
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
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const platform = detectPlatform(post.video_url);
  const embed = reelEmbedUrl(post.video_url);
  const ytId = extractYouTubeId(post.video_url);
  const viewed = useRef(false);

  const views = useQuery({
    queryKey: ["views", post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("views_count")
        .eq("id", post.id)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.views_count ?? 0);
    },
    initialData: Number(post.views_count ?? 0),
  });

  async function registerView() {
    if (viewed.current) return;
    viewed.current = true;
    await supabase.rpc("register_post_view", { _post_id: post.id });
    qc.invalidateQueries({ queryKey: ["views", post.id] });
  }

  useEffect(() => {
    if (unlocked && embed) void registerView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, embed]);

  const saved = useQuery({
    queryKey: ["saved", post.id, currentUserId],
    enabled: !!currentUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saves")
        .select("post_id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("سجّل الدخول للحفظ");
      if (saved.data) {
        const { error } = await supabase
          .from("saves")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saves")
          .insert({ post_id: post.id, user_id: currentUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved", post.id, currentUserId] });
      qc.invalidateQueries({ queryKey: ["saves", currentUserId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الريل");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["reels"] });
      qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copyNeonLink() {
    const url = `${window.location.origin}/r/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error(url);
    }
    setShowShare(false);
  }

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
        <div className="flex items-center gap-1">
          {platform && <PlatformIcon platform={platform} className="h-4 w-4" />}
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
        </div>
      </header>

      {post.content && <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>}
      {post.hashtags && <p className="mt-1 text-sm text-primary">{post.hashtags}</p>}

      {embed &&
        (unlocked || !ytId ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20">
            <iframe
              src={embed}
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
              src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
              alt="Locked video preview"
              className="h-56 w-full scale-110 object-cover blur-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/55">
              <Button
                className="rounded-full font-bold shadow-neon"
                onClick={() => {
                  void registerView();
                  openViaDirectLink(`https://www.youtube.com/watch?v=${ytId}`);
                }}
              >
                <Play className="mr-1 h-4 w-4" /> Play Video
              </Button>
            </div>
          </div>
        ))}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Reactions postId={post.id} currentUserId={currentUserId} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title="المشاهدات">
            <Eye className="h-4 w-4 text-primary" />
            {formatCount(views.data ?? 0)}
          </span>
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageCircle className="h-4 w-4" /> التعليقات
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs font-semibold"
            onClick={() => setShowShare((v) => !v)}
          >
            <Share2 className="mr-1 h-4 w-4" /> مشاركة
          </Button>
          {showShare && (
            <div className="glass absolute bottom-10 right-0 z-20 w-44 rounded-xl p-1 shadow-neon">
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-secondary"
                onClick={copyNeonLink}
              >
                <Copy className="h-4 w-4 text-primary" /> نسخ الرابط
              </button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-full text-xs font-semibold ${saved.data ? "text-primary" : ""}`}
          onClick={() => toggleSave.mutate()}
        >
          <Bookmark className={`mr-1 h-4 w-4 ${saved.data ? "fill-current" : ""}`} /> حفظ
        </Button>
        <div className="relative ms-auto">
          <Button
            variant="ghost"
            size="sm"
            aria-label="المزيد"
            className="rounded-full"
            onClick={() => setShowMore((v) => !v)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {showMore && (
            <div className="glass absolute bottom-10 left-0 z-20 w-48 rounded-xl p-1 shadow-neon">
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-secondary"
                onClick={copyNeonLink}
              >
                <Copy className="h-4 w-4 text-primary" /> نسخ رابط الريل
              </button>
              {post.video_url && (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-secondary"
                  onClick={() => {
                    openViaDirectLink(post.video_url!);
                    setShowMore(false);
                  }}
                >
                  <Play className="h-4 w-4 text-primary" /> فتح المصدر
                </button>
              )}
              {currentUserId === post.user_id && (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-secondary"
                  onClick={() => removePost.mutate()}
                >
                  <Trash2 className="h-4 w-4" /> حذف الريل
                </button>
              )}
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {new Date(post.created_at).toLocaleString()}
        </span>
      </div>

      {showComments && <Comments postId={post.id} currentUserId={currentUserId} />}
    </article>
  );
}
