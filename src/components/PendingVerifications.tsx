import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { fetchPendingVerifications, reviewVerificationFn } from "@/lib/admin.functions";

type Row = {
  user_id: string;
  username: string;
  display_name: string;
  gender: string;
  photo_url: string | null;
  created_at: string;
};

function Shot({ url }: { url: string | null }) {
  return (
    <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/30 bg-secondary">
      {url ? <img src={url} alt="صورة التوثيق" className="h-full w-full object-cover" /> : "…"}
    </span>
  );
}

/** Admin-only pending verification queue; the password is verified server-side. */
export function PendingVerifications({ pass }: { pass: string }) {
  const qc = useQueryClient();
  const loadPending = useServerFn(fetchPendingVerifications);
  const reviewOne = useServerFn(reviewVerificationFn);

  const list = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async () => (await loadPending({ data: { pass } })) as Row[],
  });

  const review = useMutation({
    mutationFn: async ({ user, approve }: { user: string; approve: boolean }) => {
      await reviewOne({ data: { pass, userId: user, approve } });
    },
    onSuccess: () => {
      toast.success("تم تنفيذ المراجعة");
      void qc.invalidateQueries({ queryKey: ["pending-verifications"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <section dir="rtl" className="space-y-2">
      <h2 className="flex items-center gap-2 text-base font-black text-primary">
        <ShieldCheck className="h-5 w-5" /> طلبات التوثيق المعلقة
      </h2>
      {list.isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}
      {list.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">لا طلبات معلقة حالياً.</p>
      )}
      <ul className="space-y-2">
        {list.data?.map((r) => (
          <li key={r.user_id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <Shot url={r.photo_url} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{r.display_name || r.username}</span>
              <span className="block text-xs text-muted-foreground">@{r.username}</span>
              <span className="block text-xs font-semibold">
                {r.gender === "female" ? "أنثى 👩" : "ذكر 👨"}
              </span>
            </span>
            <span className="flex flex-col gap-1">
              <Button
                size="sm"
                className="rounded-full font-bold"
                disabled={review.isPending}
                onClick={() => review.mutate({ user: r.user_id, approve: true })}
              >
                موافقة
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full font-bold text-destructive"
                disabled={review.isPending}
                onClick={() => review.mutate({ user: r.user_id, approve: false })}
              >
                رفض
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
