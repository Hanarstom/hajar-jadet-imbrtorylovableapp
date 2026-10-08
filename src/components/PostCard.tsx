import { useRef, useState } from "react";
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
import { PresenceBadge } from "@/components/PresenceBadge";
import { ReelFrame } from "@/components/ReelFrame";
import {
  detectPlatform,
  formatCount,
  openViaDirectLink,
  reelEmbedUrl,
} from "@/lib/neon";
import { countryFlag } from "@/lib/countries";
import { VerifiedBadge, verifiedNameClass } from "@/components/VerifiedName";
import { maybeShowPopunder } from "@/lib/adsterra";


export const POST_SELECT =
  "id, user_id, content, hashtags, video_url, platform, views_count, created_at, profiles(username, display_name, avatar_url, last_seen_at, is_online, country_code, gender, is_verified)";

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
    | {
        username: string;
        display_name: string;
        avatar_url: string | null;
        last_seen_at?: string | null;
        is_online?: boolean;
        country_code?: string | null;
        gender?: string | null;
        is_verified?: boolean | null;
      }
    | null;
};


export function PostCard({
  post,
  currentUserId,
}: {
  post: FeedPost;
  currentUserId?: string | undefined;
  /** Kept for compatibility — reels always play inline now. */
  unlocked?: boolean;
}) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const platform = detectPlatform(post.video_url);
  const embed = reelEmbedUrl(post.video_url);
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

  /** Unique view: counted once per viewer, guarded locally and in the database. */
  async function registerView() {
    if (viewed.current) return;
    viewed.current = true;
    const key = `neon-viewed:${post.id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* storage unavailable */
    }
    await supabase.rpc("register_post_view", { _post_id: post.id });
    qc.invalidateQueries({ queryKey: ["views", post.id] });
    // Popunder is self-gated: max 2/day and never more often than every 5 hours.
    maybeShowPopunder();
  }

  // View counting is triggered by <ReelFrame /> after 2 real seconds on screen.


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
    <article className="post-card border-b border-border py-5">
      <header dir="rtl" className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <Link
          to="/u/$username"
          params={{ username: post.profiles?.username ?? "" }}
          className="flex min-w-0 items-start gap-3"
        >
          <Avatar
            src={post.profiles?.avatar_url}
            name={post.profiles?.display_name}
            className="h-10 w-10 shrink-0 text-sm"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-relaxed">
              <span className="me-1">{countryFlag(post.profiles?.country_code)}</span>
              <span
                className={verifiedNameClass(post.profiles?.gender, post.profiles?.is_verified)}
              >
                {post.profiles?.display_name || "Unknown"}
              </span>
              <VerifiedBadge
                gender={post.profiles?.gender}
                isVerified={post.profiles?.is_verified}
              />
            </span>

            <span className="block text-xs text-muted-foreground">
              @{post.profiles?.username}
            </span>
            <PresenceBadge lastSeenAt={post.profiles?.last_seen_at} isOnline={post.profiles?.is_online} />
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

      {post.content && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>}
      {post.hashtags && <p className="mt-1 text-sm text-primary">{post.hashtags}</p>}

      {embed && (
        <ReelFrame
          postId={post.id}
          embed={embed}
          platform={platform}
          title={post.content || "Reel"}
          onVisibleTwoSeconds={() => void registerView()}
        />
      )}


      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-secondary text-xs font-semibold"
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
          className={`rounded-full bg-secondary text-xs font-semibold ${saved.data ? "text-primary" : ""}`}
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
        <span className="ms-auto text-[10px] text-muted-foreground">
          {new Date(post.created_at).toLocaleString()}
        </span>
      </div>

      {showComments && <Comments postId={post.id} currentUserId={currentUserId} />}
    </article>
  );
}
