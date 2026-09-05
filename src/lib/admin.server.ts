import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Admin gate password. Overridable through an env secret; never shipped to the browser. */
const ADMIN_PASSWORD = process.env["ADMIN_PANEL_PASSWORD"] ?? "1995@@hana1995$$";

export type PendingVerification = {
  user_id: string;
  username: string;
  display_name: string;
  gender: string;
  photo_url: string | null;
  created_at: string;
};

function assertAdmin(pass: string) {
  if (pass !== ADMIN_PASSWORD) throw new Error("كلمة السر غير صحيحة");
}

export async function listPendingVerifications(pass: string): Promise<PendingVerification[]> {
  assertAdmin(pass);

  const { data, error } = await supabaseAdmin
    .from("verifications")
    .select("user_id, gender, photo_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error("تعذر تحميل الطلبات");
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: profs } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .in(
      "id",
      rows.map((r) => r.user_id),
    );

  return await Promise.all(
    rows.map(async (r) => {
      const prof = profs?.find((p) => p.id === r.user_id);
      const signed = await supabaseAdmin.storage
        .from("media")
        .createSignedUrl(r.photo_path, 60 * 10);
      return {
        user_id: r.user_id,
        username: prof?.username ?? "",
        display_name: prof?.display_name ?? "",
        gender: r.gender,
        photo_url: signed.data?.signedUrl ?? null,
        created_at: r.created_at,
      };
    }),
  );
}

export async function reviewVerification(pass: string, userId: string, approve: boolean) {
  assertAdmin(pass);

  const status = approve ? "approved" : "rejected";

  const { error: vErr } = await supabaseAdmin
    .from("verifications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (vErr) throw new Error("تعذر تحديث الطلب");

  const { error: pErr } = await supabaseAdmin
    .from("profiles")
    .update({ is_verified: approve, verification_status: status })
    .eq("id", userId);
  if (pErr) throw new Error("تعذر تحديث الحساب");

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "verification",
    meta: approve
      ? "🛡️ تم توثيق حسابك بحماية غوغل"
      : "تم رفض طلب التوثيق، أعد المحاولة بصورة أوضح",
  });

  if (approve) await supabaseAdmin.rpc("evaluate_referral_activity", { _user: userId });

  return "ok" as const;
}
