import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Users, Clock, Camera, Pencil, UserRound, Film, Bookmark, BarChart3, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PostCard, POST_SELECT, type FeedPost } from "@/components/PostCard";
import { useSession } from "@/hooks/useSession";
import { PresenceBadge } from "@/components/PresenceBadge";
import { formatCount } from "@/lib/neon";
import { cropToSquare, uploadMedia, useMediaUrl } from "@/lib/media";
import { ReelGrid } from "@/components/ReelGrid";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { countryFlag } from "@/lib/countries";

const PROFILE_PAGE_SIZE = 9;

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl px-3 py-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="neon-text mt-1.5 text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function ProfileView({ username }: { username: string }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const counted = useRef(false);

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, bio, total_views, watch_hours, profile_views, last_seen_at, is_online, country_code",
        )
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profileId = profile.data?.id;
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`profile-presence-${profileId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${profileId}` },
        () => void qc.invalidateQueries({ queryKey: ["profile", username] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profileId, qc, username]);

  const isMe = !!user && user.id === profileId;

  useEffect(() => {
    if (!profileId || counted.current || isMe) return;
    counted.current = true;
    void supabase
      .rpc("register_profile_view", { _profile_id: profileId })
      .then(() => qc.invalidateQueries({ queryKey: ["profile", username] }));
  }, [profileId, isMe, qc, username]);

  const followers = useQuery({
    queryKey: ["followers", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileId!);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const isFollowing = useQuery({
    queryKey: ["is-following", profileId, user?.id],
    enabled: !!profileId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", profileId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const posts = useInfiniteQuery({
    queryKey: ["profile-posts", profileId],
    enabled: !!profileId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("user_id", profileId!)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PROFILE_PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PROFILE_PAGE_SIZE ? pages.length * PROFILE_PAGE_SIZE : undefined,
  });
  const profilePosts = posts.data?.pages.flat() ?? [];

  const reelCount = useQuery({
    queryKey: ["profile-reel-count", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profileId!)
        .not("video_url", "is", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const savedPosts = useQuery({
    queryKey: ["saved-posts", user?.id],
    enabled: !!user && user.id === profileId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("saves")
        .select("post_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.post_id);
      if (ids.length === 0) return [] as FeedPost[];
      const { data, error: e2 } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (e2) throw e2;
      return (data ?? []) as unknown as FeedPost[];
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to follow");
      if (isFollowing.data) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profileId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following", profileId, user?.id] });
      qc.invalidateQueries({ queryKey: ["followers", profileId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), bio: bio.trim() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      toast.success("تم تحديث الملف");
      qc.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profileStories = useQuery({
    queryKey: ["profile-stories", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id, body, created_at")
        .eq("user_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).filter((s) => (s.body ?? "").trim().length > 0);
    },
  });

  const avatarUrl = useMediaUrl(profile.data?.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Sign in to update your picture");
      const blob = await cropToSquare(file, 512);
      const path = await uploadMedia(user.id, "avatars", blob);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (error) throw error;
      // Auto post on the home feed + instant alert for followers only.
      await supabase
        .from("posts")
        .insert({ user_id: user.id, content: "حدّثتُ صورة ملفي الشخصي 🖼️✨", platform: "profile" });
      await supabase.rpc("notify_followers", {
        _type: "avatar",
        _meta: "حدّث صورة ملفه الشخصي",
      } as unknown as { _type: string; _post_id: string; _meta: string });
    },
    onSuccess: () => {
      toast.success("تم تحديث الصورة ونشرها بالرئيسية");
      qc.invalidateQueries({ queryKey: ["profile", username] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile.isLoading)
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;

  if (!profile.data)
    return (
      <p className="text-sm text-muted-foreground">No creator found for @{username}.</p>
    );

  const p = profile.data;

  return (
    <div className="space-y-4">
      <section className="glass relative overflow-hidden rounded-3xl p-6 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto h-28 w-28">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl" />
          <span className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-2 border-primary/60 bg-secondary text-3xl font-black shadow-neon">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${p.display_name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              (p.display_name || p.username).charAt(0).toUpperCase()
            )}
          </span>
          {isMe && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar.mutate(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Change profile picture"
                onClick={() => fileRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-1 right-0 grid h-9 w-9 place-items-center rounded-full border border-primary/60 bg-background text-primary shadow-neon"
              >
                <Camera className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {isMe && uploadAvatar.isPending && (
          <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>
        )}

        {editing ? (
          <div dir="rtl" className="mt-4 space-y-2 text-right">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الظاهر"
              maxLength={40}
            />
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="البايو"
              maxLength={200}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1 font-bold"
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending}
              >
                حفظ
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-4 flex items-center justify-center gap-2 truncate text-2xl font-black tracking-tight">
              <span>{countryFlag(p.country_code)}</span>
              {p.display_name || p.username}
              {user && user.id !== p.id && (
                <Button
                  size="sm"
                  onClick={() => toggleFollow.mutate()}
                  disabled={toggleFollow.isPending}
                  className={`rounded-full font-bold ${
                    isFollowing.data
                      ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }`}
                >
                  {isFollowing.data ? "إلغاء المتابعة" : "متابعة"}
                </Button>
              )}
              {isMe && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  aria-label="تعديل الملف"
                  onClick={() => {
                    setName(p.display_name || "");
                    setBio(p.bio || "");
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </h1>
            <p className="text-sm text-primary/80">@{p.username}</p>
            {p.bio && (
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {p.bio}
              </p>
            )}
          </>
        )}

        <div className="mt-1 flex justify-center">
          <PresenceBadge lastSeenAt={p.last_seen_at} isOnline={p.is_online} />
        </div>

        <button
          type="button"
          onClick={() => setShowProject((v) => !v)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/15 px-4 py-3 text-base font-black text-primary shadow-neon"
        >
          <BarChart3 className="h-5 w-5" /> مشاهدة المشروع
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showProject ? "rotate-180" : ""}`}
          />
        </button>

        {showProject && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile icon={Users} label="Followers" value={formatCount(followers.data ?? 0)} />
            <StatTile
              icon={Eye}
              label="Total Views"
              value={formatCount(Number(p.total_views ?? 0))}
            />
            <StatTile
              icon={Clock}
              label="Watch Hours"
              value={formatCount(Number(p.watch_hours ?? 0))}
            />
            <StatTile
              icon={UserRound}
              label="زوار الملف"
              value={formatCount(Number(p.profile_views ?? 0))}
            />
            <StatTile
              icon={Film}
              label="ريلز مضمّنة"
              value={formatCount(
                reelCount.data ?? 0,
              )}
            />
          </div>
        )}
      </section>

      {profileStories.data && profileStories.data.length > 0 && (
        <section dir="rtl" className="glass rounded-2xl p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            القصص النصية
          </h2>
          <ul className="mt-2 space-y-2">
            {profileStories.data.map((s) => (
              <li key={s.id} className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="whitespace-pre-wrap text-sm">{s.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profilePosts.some((x) => !!x.video_url) && (
        <section dir="rtl" className="space-y-2">
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            الريلز
          </h2>
          <ReelGrid posts={profilePosts.filter((x) => !!x.video_url)} />
        </section>
      )}

      {profilePosts
        .filter((x) => !x.video_url)
        .map((post) => (
          <PostCard key={post.id} post={post} currentUserId={user?.id} unlocked />
        ))}

      {profilePosts.length === 0 && !posts.isLoading && (
        <p className="text-sm text-muted-foreground">لا ريلز بعد.</p>
      )}

      <InfiniteScrollTrigger
        hasMore={!!posts.hasNextPage}
        loading={posts.isFetchingNextPage}
        onLoadMore={() => void posts.fetchNextPage()}
      />

      {isMe && (
        <section dir="rtl" className="space-y-2">
          <h2 className="flex items-center gap-2 px-1 text-sm font-bold text-primary">
            <Bookmark className="h-4 w-4" /> العناصر المحفوظة
          </h2>
          {savedPosts.data && savedPosts.data.length > 0 ? (
            <ReelGrid posts={savedPosts.data} />
          ) : (
            <p className="text-sm text-muted-foreground">لا عناصر محفوظة بعد.</p>
          )}
        </section>
      )}
    </div>
  );
}
