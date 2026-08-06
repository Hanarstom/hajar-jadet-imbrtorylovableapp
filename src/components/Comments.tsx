import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";

type CommentRow = {
  id: string;
  body: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null } | null;
};

function MentionText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(@[A-Za-z0-9_.]+)/g).map((part, i) =>
        part.startsWith("@") ? (
          <Link
            key={i}
            to="/u/$username"
            params={{ username: part.slice(1) }}
            className="font-semibold text-primary hover:underline"
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function CommentForm({
  postId,
  parentId,
  currentUserId,
  placeholder,
  onDone,
}: {
  postId: string;
  parentId: string | null;
  currentUserId: string;
  placeholder: string;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const mentionTerm = /(?:^|\s)@([A-Za-z0-9_.]{1,20})$/.exec(text)?.[1] ?? null;

  const suggestions = useQuery({
    queryKey: ["mention-search", mentionTerm],
    enabled: !!mentionTerm,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .ilike("username", `${mentionTerm}%`)
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        parent_id: parentId,
        body: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      onDone?.();
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) add.mutate();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
        />
        <Button type="submit" size="sm" disabled={add.isPending} aria-label="Send comment">
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {mentionTerm && suggestions.data && suggestions.data.length > 0 && (
        <ul className="glass absolute bottom-11 left-0 z-20 w-56 space-y-1 rounded-xl p-1.5">
          {suggestions.data.map((s) => (
            <li key={s.username}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-secondary"
                onClick={() =>
                  setText((t) => t.replace(/@[A-Za-z0-9_.]*$/, `@${s.username} `))
                }
              >
                <Avatar
                  src={s.avatar_url}
                  name={s.display_name}
                  className="h-6 w-6 text-[10px]"
                />
                <span className="truncate">
                  {s.display_name} <span className="text-muted-foreground">@{s.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  postId,
  currentUserId,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  postId: string;
  currentUserId?: string | undefined;
}) {
  const qc = useQueryClient();
  const [replying, setReplying] = useState(false);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Avatar
          src={comment.profiles?.avatar_url}
          name={comment.profiles?.display_name}
          className="mt-0.5 h-7 w-7 shrink-0 text-[11px]"
        />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-secondary/60 px-3 py-2">
            <p className="text-xs font-semibold">
              {comment.profiles?.display_name ?? "User"}
              <span className="ml-1 font-normal text-muted-foreground">
                @{comment.profiles?.username}
              </span>
            </p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
              <MentionText text={comment.body} />
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-2 text-[11px] text-muted-foreground">
            {currentUserId && (
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => setReplying((v) => !v)}
              >
                رد · Reply
              </button>
            )}
            {currentUserId === comment.user_id && (
              <button
                type="button"
                className="flex items-center gap-1 hover:text-destructive"
                onClick={() => remove.mutate(comment.id)}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {(replies.length > 0 || replying) && (
        <div className="space-y-2 border-l border-border pl-4 ml-4">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={[]}
              postId={postId}
              currentUserId={currentUserId}
            />
          ))}
          {replying && currentUserId && (
            <CommentForm
              postId={postId}
              parentId={comment.id}
              currentUserId={currentUserId}
              placeholder={`Reply to @${comment.profiles?.username ?? ""}`}
              onDone={() => setReplying(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function Comments({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId?: string | undefined;
}) {
  const comments = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, body, user_id, parent_id, created_at, profiles(username, display_name, avatar_url)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const all = comments.data ?? [];
  const roots = all.filter((c) => !c.parent_id);

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {roots.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          replies={all.filter((r) => r.parent_id === c.id)}
          postId={postId}
          currentUserId={currentUserId}
        />
      ))}
      {all.length === 0 && !comments.isLoading && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}
      {currentUserId && (
        <CommentForm
          postId={postId}
          parentId={null}
          currentUserId={currentUserId}
          placeholder="Write a comment… use @ to tag"
        />
      )}
    </div>
  );
}
