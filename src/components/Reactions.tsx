import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { playReactionSound } from "@/lib/feedback";

type ReactionType = "like" | "love" | "haha" | "sad";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "👍", label: "أعجبني" },
  { type: "love", emoji: "❤️", label: "أحببته" },
  { type: "haha", emoji: "😂", label: "ضحكني" },
  { type: "sad", emoji: "😢", label: "أحزنني" },
];

export function Reactions({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId?: string | undefined;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const rows = useQuery({
    queryKey: ["reactions", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("type, user_id")
        .eq("post_id", postId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mine = rows.data?.find((r) => r.user_id === currentUserId)?.type as
    | ReactionType
    | undefined;

  const react = useMutation({
    mutationFn: async (type: ReactionType) => {
      if (!currentUserId) throw new Error("Sign in to react");
      if (mine === type) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("reactions")
        .upsert(
          { post_id: postId, user_id: currentUserId, type },
          { onConflict: "post_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["reactions", postId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = REACTIONS.map((r) => ({
    ...r,
    count: rows.data?.filter((row) => row.type === r.type).length ?? 0,
  }));
  const total = rows.data?.length ?? 0;
  const active = REACTIONS.find((r) => r.type === mine);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:border-primary/60 hover:text-foreground",
            active ? "border-primary/60 text-primary" : "text-muted-foreground",
          )}
        >
          <span className="text-sm leading-none">{active?.emoji ?? "👍"}</span>
          {active?.label ?? "تفاعل"}
        </button>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {counts
            .filter((c) => c.count > 0)
            .map((c) => (
              <span key={c.type} className="flex items-center gap-0.5">
                <span className="text-sm leading-none">{c.emoji}</span>
                {c.count}
              </span>
            ))}
          {total > 0 && <span className="text-muted-foreground/70">· {total}</span>}
        </div>
      </div>

      {open && (
        <div className="glass absolute bottom-9 left-0 z-20 flex gap-1 rounded-full p-1.5 shadow-neon">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={r.label}
              aria-label={r.label}
              onClick={() => {
                playReactionSound(r.type);
                react.mutate(r.type);
              }}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full text-lg transition-transform hover:scale-125",
                mine === r.type && "bg-primary/20",
              )}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
