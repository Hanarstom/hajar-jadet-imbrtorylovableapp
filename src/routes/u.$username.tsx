import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProfileView } from "@/components/ProfileView";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} on Neon — Profile & Reels` },
      {
        name: "description",
        content: `See @${params.username}'s posts, followers count and total reel views on Neon.`,
      },
      { property: "og:title", content: `@${params.username} on Neon` },
      {
        property: "og:description",
        content: `Follow @${params.username} on the Neon creator feed.`,
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  return (
    <Layout>
      <ProfileView username={username} />
    </Layout>
  );
}
