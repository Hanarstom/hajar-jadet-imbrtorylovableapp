import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات — Neon Reels Alerts" },
      {
        name: "description",
        content:
          "See who followed you, commented on your reels or reacted to them on Neon, in real time.",
      },
      { property: "og:title", content: "Neon Notifications" },
      {
        property: "og:description",
        content: "Follows, comments and reactions on your Neon reels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

type Notif = {
  id: string;
  type: string;
  meta: string | null;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  post_id: string | null;
};

const REACTION_LABEL: Record<string, string> = {
  like: "أعجبه",
  love: "أحبّه",
  haha: "أضحكه",
  sad: "أحزنه",
};

function Notifications() {
  const { user, loading } = useSession();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, meta, is_read, created_at, actor_id, post_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
  });

  const actorIds = [...new Set((list.data ?? []).map((n) => n.actor_id).filter(Boolean))];

  const actors = useQuery({
    queryKey: ["notif-actors", actorIds.join(",")],
    enabled: actorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", actorIds as string[]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notif-unread", user?.id] });
    },
  });

  if (!user && !loading)
    return (
      <Layout>
        <p className="text-sm">
          <Link to="/auth" className="text-primary underline">
            سجّل الدخول
          </Link>{" "}
          لعرض الإشعارات.
        </p>
      </Layout>
    );

  return (
    <Layout>
      <div dir="rtl" className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-black">
            <Bell className="h-5 w-5 text-destructive" /> الإشعارات
          </h1>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markRead.mutate()}
            disabled={markRead.isPending}
          >
            تحديد كمقروء
          </Button>
        </div>

        <ul className="space-y-2">
          {list.data?.map((n) => {
            const a = actors.data?.find((x) => x.id === n.actor_id);
            const name = a?.display_name || a?.username || "شخص ما";
            const text =
              n.type === "follow"
                ? `${name} بدأ بمتابعتك`
                : n.type === "comment"
                  ? `${name} علّق: ${n.meta ?? ""}`
                  : `${name} ${REACTION_LABEL[n.meta ?? "like"] ?? "تفاعل مع"} ريلك`;
            const Icon =
              n.type === "follow"
                ? UserPlus
                : n.type === "comment"
                  ? MessageCircle
                  : Heart;
            return (
              <li
                key={n.id}
                className={`glass flex items-center gap-3 rounded-2xl p-3 ${
                  n.is_read ? "" : "border border-destructive/40"
                }`}
              >
                <Avatar
                  src={a?.avatar_url ?? null}
                  name={name}
                  className="h-10 w-10 shrink-0 text-sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{text}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
                <Icon className="h-4 w-4 shrink-0 text-destructive" />
              </li>
            );
          })}
        </ul>
        {list.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">لا إشعارات بعد.</p>
        )}
      </div>
    </Layout>
  );
}
