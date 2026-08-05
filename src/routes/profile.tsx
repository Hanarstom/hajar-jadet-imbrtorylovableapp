import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProfileView } from "@/components/ProfileView";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Neon Profile — Followers & Reel Views" },
      {
        name: "description",
        content:
          "Your Neon creator profile: followers, total reel views, watch hours and every post you published.",
      },
      { property: "og:title", content: "My Neon Profile" },
      {
        property: "og:description",
        content: "Followers, views and watch hours for your Neon creator account.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  const { user, loading } = useSession();

  const me = useQuery({
    queryKey: ["me-username", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <Layout>Loading…</Layout>;

  if (!user)
    return (
      <Layout>
        <div className="glass rounded-2xl p-6 text-center text-sm">
          <Link to="/auth" className="text-primary underline">
            Sign in
          </Link>{" "}
          to view your profile.
        </div>
      </Layout>
    );

  return (
    <Layout>
      {me.data?.username ? (
        <ProfileView username={me.data.username} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      )}
    </Layout>
  );
}
