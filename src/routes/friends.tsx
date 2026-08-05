import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends & Creator Search — Neon" },
      {
        name: "description",
        content:
          "Search Neon creators by name or @username and follow them instantly from the friends tab.",
      },
      { property: "og:title", content: "Find Friends on Neon" },
      {
        property: "og:description",
        content: "Discover and follow Neon creators in one tap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Friends,
});

type Person = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function PersonRow({ person, currentUserId }: { person: Person; currentUserId?: string }) {
  const qc = useQueryClient();

  const following = useQuery({
    queryKey: ["is-following", person.id, currentUserId],
    enabled: !!currentUserId && currentUserId !== person.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId!)
        .eq("following_id", person.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Sign in to follow");
      if (following.data) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", person.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: person.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following", person.id, currentUserId] });
      qc.invalidateQueries({ queryKey: ["followers", person.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="glass glass-hover grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3">
      <Link
        to="/u/$username"
        params={{ username: person.username }}
        className="flex min-w-0 items-center gap-3"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-primary/30 bg-secondary text-sm font-bold">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={`${person.display_name} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            (person.display_name || person.username).charAt(0).toUpperCase()
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">
            {person.display_name || person.username}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            @{person.username}
          </span>
        </span>
      </Link>
      {currentUserId && currentUserId !== person.id && (
        <Button
          size="sm"
          variant={following.data ? "secondary" : "default"}
          className="shrink-0 rounded-full font-bold"
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
        >
          {following.data ? (
            <>
              <UserCheck className="mr-1 h-4 w-4" /> متابَع
            </>
          ) : (
            <>
              <UserPlus className="mr-1 h-4 w-4" /> متابعة
            </>
          )}
        </Button>
      )}
    </li>
  );
}

function Friends() {
  const { user } = useSession();
  const [term, setTerm] = useState("");
  const q = term.trim();

  const people = useQuery({
    queryKey: ["people", q],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .limit(30);
      if (q.length > 1) {
        query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Person[];
    },
  });

  return (
    <Layout>
      <div className="space-y-4">
        <div className="sticky top-16 z-10">
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5 shadow-neon">
            <Search className="h-4 w-4 shrink-0 text-primary" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث عن الأصدقاء · Search creators"
              className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
            />
          </div>
        </div>

        <h1 className="px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          الأصدقاء · Creators
        </h1>

        {people.isLoading && (
          <p className="text-sm text-muted-foreground">Loading creators…</p>
        )}
        <ul className="space-y-2">
          {people.data?.map((p) => (
            <PersonRow key={p.id} person={p} currentUserId={user?.id} />
          ))}
        </ul>
        {people.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No creators matched that search.</p>
        )}
      </div>
    </Layout>
  );
}
