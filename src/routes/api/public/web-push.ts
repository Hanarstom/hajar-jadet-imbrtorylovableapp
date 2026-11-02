import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ eventId: z.string().uuid(), secret: z.string().length(64) });

const TEXT: Record<string, (n: string) => string> = {
  comment: (n) => `${n} علّق على منشورك 💬`,
  post: (n) => `${n} نشر منشورًا جديدًا 📝`,
  member: (n) => `انضم عضو جديد: ${n} 🎉`,
};

export const Route = createFileRoute("/api/public/web-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getVapidKeys } = await import("@/lib/push.server");
        const { buildPushPayload } = await import("@block65/webcrypto-web-push");

        const { data: ev } = await supabaseAdmin
          .from("push_events")
          .select("*")
          .eq("id", parsed.data.eventId)
          .maybeSingle();
        if (!ev || ev.secret !== parsed.data.secret)
          return new Response("forbidden", { status: 403 });

        const { data: actor } = await supabaseAdmin
          .from("profiles")
          .select("display_name, username")
          .eq("id", ev.actor_id)
          .maybeSingle();
        const name = actor?.display_name || actor?.username || "عضو";
        const url = ev.post_id ? `/r/${ev.post_id}` : ev.kind === "member" ? "/friends" : "/";
        const body = (TEXT[ev.kind] ?? (() => "لديك إشعار جديد"))(name);

        const { data: claimed } = await supabaseAdmin.rpc("claim_push_deliveries", {
          _event: ev.id,
        });
        const rows = (claimed ?? []) as { subscription_id: string }[];
        if (!rows.length) return Response.json({ sent: 0 });
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .in("id", rows.map((r) => r.subscription_id));
        const vapid = await getVapidKeys();
        let sent = 0;

        await Promise.all(
          (subs ?? []).map(async (s) => {
            let status = 0;
            try {
              const payload = await buildPushPayload(
                {
                  data: { title: "منصة حجر الجاديت الإمبراطوري", body, url },
                  options: { ttl: 86400, urgency: "high" },
                },
                { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
                vapid,
              );
              const res = await fetch(s.endpoint, payload);
              status = res.status;
            } catch {
              status = 0;
            }
            if (status === 404 || status === 410) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
              return;
            }
            const ok = status >= 200 && status < 300;
            if (ok) sent++;
            await supabaseAdmin
              .from("push_deliveries")
              .update({ status: ok ? "sent" : "retry", response_status: status })
              .eq("event_id", ev.id)
              .eq("subscription_id", s.id);
          }),
        );
        return Response.json({ sent });
      },
    },
  },
});
