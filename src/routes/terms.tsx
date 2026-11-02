import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PlatformAds } from "@/components/PlatformAds";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الربح والإعلانات — منصة حجر الجاديت الإمبراطوري" },
      { name: "description", content: "منشورات الإدارة وإعلاناتها وتعليمات الربح في منصة حجر الجاديت الإمبراطوري." },
      { property: "og:title", content: "شروط الربح والإعلانات — منصة حجر الجاديت الإمبراطوري" },
      { property: "og:description", content: "جميع منشورات الإدارة وإعلاناتها وتعليمات الربح." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Layout>
      <section dir="rtl" className="min-w-0">
        <h1 className="border-b border-border pb-4 text-xl font-bold">شروط الربح والإعلانات</h1>
        <PlatformAds />
      </section>
    </Layout>
  );
}