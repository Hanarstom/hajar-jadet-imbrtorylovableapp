import { Link } from "@tanstack/react-router";
import { Eye, Play } from "lucide-react";
import { extractYouTubeId, detectPlatform, formatCount } from "@/lib/neon";
import { PlatformIcon } from "@/components/PlatformIcons";
import type { FeedPost } from "@/components/PostCard";

/** YouTube-Shorts-style grid of reels. */
export function ReelGrid({ posts }: { posts: FeedPost[] }) {
  return (
    <div dir="rtl" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {posts.map((post) => {
        const platform = detectPlatform(post.video_url);
        const ytId = extractYouTubeId(post.video_url);
        return (
          <Link
            key={post.id}
            to="/r/$postId"
            params={{ postId: post.id }}
            className="relative block overflow-hidden rounded-lg border border-border"
          >
            <span className="block aspect-[9/16] w-full bg-secondary/50">
              {ytId ? (
                <img
                  src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
                  alt={post.content || "reel"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center">
                  {platform ? (
                    <PlatformIcon platform={platform} className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 text-primary" />
                  )}
                </span>
              )}
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/70 px-2 py-1.5 text-[12px] font-semibold">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5 text-primary" />
                {formatCount(Number(post.views_count ?? 0))}
              </span>
              {platform && <PlatformIcon platform={platform} className="h-3.5 w-3.5" />}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
