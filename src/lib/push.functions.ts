import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { getVapidKeys } = await import("./push.server");
  return (await getVapidKeys()).publicKey;
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        endpoint: z.string().url().startsWith("https://").max(1000),
        p256dh: z.string().min(10).max(200),
        auth: z.string().min(8).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "endpoint" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
