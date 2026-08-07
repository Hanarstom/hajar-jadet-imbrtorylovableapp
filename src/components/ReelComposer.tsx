import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  YouTubeIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from "@/components/PlatformIcons";
import { detectPlatform, reelEmbedUrl } from "@/lib/neon";

export function ReelComposer({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  const publish = useMutation({
    mutationFn: async () => {
      const url = (ytUrl.trim() || socialUrl.trim()).trim();
      const platform = detectPlatform(url);
      if (!url) throw new Error("الصق رابط ريل أولاً");
      if (!platform || !reelEmbedUrl(url))
        throw new Error("رابط غير مدعوم — استخدم يوتيوب، إنستغرام، فيسبوك أو تيك توك");
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        content: content.trim(),
        hashtags: hashtags.trim(),
        video_url: url,
        platform,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setHashtags("");
      setYtUrl("");
      setSocialUrl("");
      toast.success("تم نشر الريل");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["reels"] });
      qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      dir="rtl"
      className="glass space-y-4 rounded-2xl p-4"
      onSubmit={(e) => {
        e.preventDefault();
        publish.mutate();
      }}
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب وصف الريل…"
        maxLength={1000}
      />
      <Input
        value={hashtags}
        onChange={(e) => setHashtags(e.target.value)}
        placeholder="#neon #reels"
        maxLength={200}
      />

      <section className="rounded-2xl border border-[#FF0000]/30 bg-[#FF0000]/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <YouTubeIcon className="h-5 w-5" />
          <span className="text-xs font-bold">ريلز يوتيوب · Shorts</span>
        </div>
        <Input
          value={ytUrl}
          onChange={(e) => {
            setYtUrl(e.target.value);
            if (e.target.value) setSocialUrl("");
          }}
          placeholder="الصق رابط يوتيوب / Shorts"
          maxLength={300}
        />
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <InstagramIcon className="h-5 w-5" />
          <FacebookIcon className="h-5 w-5" />
          <TikTokIcon className="h-5 w-5" />
          <span className="text-xs font-bold">ريلز إنستغرام · فيسبوك · تيك توك</span>
        </div>
        <Input
          value={socialUrl}
          onChange={(e) => {
            setSocialUrl(e.target.value);
            if (e.target.value) setYtUrl("");
          }}
          placeholder="الصق رابط ريل إنستغرام أو فيسبوك أو تيك توك"
          maxLength={300}
        />
      </section>

      <Button type="submit" className="w-full font-bold" disabled={publish.isPending}>
        نشر الريل
      </Button>
    </form>
  );
}
