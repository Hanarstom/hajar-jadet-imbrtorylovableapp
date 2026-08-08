import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Layout } from "@/components/Layout";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "خصوصية المنصة خدمة العملاء" },
      {
        name: "description",
        content: "قسم خدمة العملاء وخصوصية المنصة الخاص بإدارة منصة حجر الجاديت الإمبراطوري.",
      },
      { property: "og:title", content: "خصوصية المنصة خدمة العملاء" },
      { property: "og:description", content: "قسم إدارة المنصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PrivacyAdmin,
});

const GATE = "1995@@hana1995$$";

function PrivacyAdmin() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [pass, setPass] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");

  const ads = useQuery({
    queryKey: ["admin-ads"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_ads")
        .select("id, title, body, link_url, author_id, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("سجّل الدخول بحساب الإدارة أولاً");
      const { error } = await supabase.from("platform_ads").insert({
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        link_url: link.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      setLink("");
      toast.success("تم نشر إعلان الإدارة");
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      qc.invalidateQueries({ queryKey: ["platform-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      qc.invalidateQueries({ queryKey: ["platform-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open)
    return (
      <Layout>
        <div dir="rtl" className="glass mx-auto max-w-sm space-y-3 rounded-3xl p-6">
          <h1 className="flex items-center gap-2 text-lg font-black">
            <Lock className="h-5 w-5 text-primary" /> خصوصية المنصة خدمة العملاء
          </h1>
          <p className="text-xs text-muted-foreground">
            هذا القسم مخصص للإدارة فقط. أدخل كلمة السر للمتابعة.
          </p>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (pass === GATE) setOpen(true);
              else toast.error("كلمة السر غير صحيحة");
            }}
          >
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="كلمة السر"
            />
            <Button type="submit" className="w-full font-bold">
              دخول
            </Button>
          </form>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div dir="rtl" className="space-y-4">
        <h1 className="flex items-center gap-2 text-lg font-black">
          <ShieldCheck className="h-5 w-5 text-primary" /> لوحة إعلانات الإدارة
        </h1>

        <div className="glass space-y-2 rounded-2xl p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الإعلان"
            maxLength={80}
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="نص إعلان الإدارة…"
            maxLength={500}
          />
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="رابط (اختياري)"
          />
          <Button
            className="w-full font-bold"
            onClick={() => publish.mutate()}
            disabled={publish.isPending || (!title.trim() && !body.trim())}
          >
            نشر الإعلان
          </Button>
        </div>

        <ul className="space-y-2">
          {ads.data?.map((ad) => (
            <li key={ad.id} className="glass flex items-start gap-2 rounded-2xl p-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{ad.title}</span>
                <span className="block whitespace-pre-wrap text-xs text-muted-foreground">
                  {ad.body}
                </span>
              </span>
              {user?.id === ad.author_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="حذف الإعلان"
                  onClick={() => remove.mutate(ad.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
