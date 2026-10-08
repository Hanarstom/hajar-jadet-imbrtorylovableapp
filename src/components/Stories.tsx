import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";
import { useMediaUrl, cropToSquare, uploadMedia } from "@/lib/media";
import { useSession } from "@/hooks/useSession";

type StoryRow = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null } | null;
};

function StoryViewer({ story, onClose }: { story: StoryRow; onClose: () => void }) {
  const img = useMediaUrl(story.image_url);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4">
      <div className="glass relative w-full max-w-sm overflow-hidden rounded-3xl p-5">
        <button
          type="button"
          aria-label="Close story"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/70 p-1.5"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Avatar
            src={story.profiles?.avatar_url}
            name={story.profiles?.display_name}
            className="h-9 w-9 text-sm"
          />
          <div>
            <p className="text-sm font-semibold leading-tight">{story.profiles?.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(story.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {img && (
          <img
            src={img}
            alt="Story"
            className="mt-4 aspect-square w-full rounded-2xl object-cover"
          />
        )}
        {story.body && <p className="mt-4 whitespace-pre-wrap text-sm">{story.body}</p>}
      </div>
    </div>
  );
}

export function Stories() {
  const { user } = useSession();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [active, setActive] = useState<StoryRow | null>(null);

  const stories = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select(
          "id, user_id, body, image_url, created_at, profiles(username, display_name, avatar_url)",
        )
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as StoryRow[];
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to add a story");
      let imagePath: string | null = null;
      if (file) {
        const blob = await cropToSquare(file, 900);
        imagePath = await uploadMedia(user.id, "stories", blob);
      }
      const { error } = await supabase
        .from("stories")
        .insert({ user_id: user.id, body: body.trim(), image_url: imagePath });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      setFile(null);
      setComposing(false);
      toast.success("Story published — live for 24h");
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section dir="rtl" className="border-b border-border py-4">
      <div className="flex items-center justify-between px-1 pb-4">
        <h2 className="text-base font-bold text-foreground">
          القصص · Stories
        </h2>
        <span className="text-[10px] text-muted-foreground">24h</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {user && (
          <button
            type="button"
            onClick={() => setComposing((v) => !v)}
            className="flex w-28 shrink-0 flex-col items-center gap-2"
          >
            <span className="grid aspect-[9/16] w-28 place-items-center rounded-lg border border-border bg-secondary text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <span className="truncate text-[10px] text-muted-foreground">أضف</span>
          </button>
        )}
        {stories.data?.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s)}
            className="flex w-28 shrink-0 flex-col items-center gap-2"
          >
            <span className="block overflow-hidden rounded-lg border border-border">
              <Avatar
                src={s.image_url ?? s.profiles?.avatar_url}
                name={s.profiles?.display_name}
                className="aspect-[9/16] w-28 rounded-lg border-0 text-sm"
              />
            </span>
            <span className="w-28 truncate text-center text-xs text-muted-foreground">
              {s.profiles?.username}
            </span>
          </button>
        ))}
        {stories.data?.length === 0 && !user && (
          <p className="py-3 text-xs text-muted-foreground">No stories yet.</p>
        )}
      </div>

      {composing && user && (
        <form
          className="mt-3 space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim() || file) publish.mutate();
          }}
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Story text…"
            maxLength={200}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              {file ? "Image selected" : "Add image"}
            </Button>
            <Button type="submit" size="sm" disabled={publish.isPending}>
              Share story
            </Button>
          </div>
        </form>
      )}

      {active && <StoryViewer story={active} onClose={() => setActive(null)} />}
    </section>
  );
}
