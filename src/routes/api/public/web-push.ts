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
        const isChat = ev.kind === 'chat_message' || ev.kind === 'chat_request';
        const url = isChat && ev.chat_id ? `/chat?conversation=${ev.chat_id}` : ev.post_id ? `/r/${ev.post_id}` : ev.kind === "member" ? "/friends" : "/";
        let body = (TEXT[ev.kind] ?? (() => "لديك إشعار جديد"))(name);
        if (isChat) {
          const { data: friendship } = await supabaseAdmin.from('chat_friendships').select('requester_id,recipient_id').eq('id', ev.chat_id ?? '').maybeSingle();
          if (!friendship || !ev.recipient_id) return Response.json({ sent: 0 });
          const { data: blocks } = await supabaseAdmin.from('chat_blocks').select('blocker_id,blocked_id').or(`and(blocker_id.eq.${ev.actor_id},blocked_id.eq.${ev.recipient_id}),and(blocker_id.eq.${ev.recipient_id},blocked_id.eq.${ev.actor_id})`);
          if (blocks?.length) return Response.json({ sent: 0 });
          const { data: notification } = await supabaseAdmin.from('notifications').select('meta').eq('id',ev.notification_id ?? '').eq('user_id',ev.recipient_id).maybeSingle();
          body = ev.kind === 'chat_request' ? `${name} أرسل طلب صداقة` : `${name}: ${notification?.meta || 'رسالة جديدة'}`;
        }

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
            if (isChat) {
              const { data: owner } = await supabaseAdmin.from('push_subscriptions').select('user_id').eq('id',s.id).maybeSingle();
              if (owner?.user_id !== ev.recipient_id) return;
            }
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
