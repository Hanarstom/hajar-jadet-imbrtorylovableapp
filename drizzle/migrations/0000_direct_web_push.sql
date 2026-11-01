CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE TABLE public.push_subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_owner_read ON public.push_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY push_owner_delete ON public.push_subscriptions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.push_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32),'hex'), kind text NOT NULL, actor_id uuid NOT NULL, recipient_id uuid, post_id uuid, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.push_events TO service_role;
ALTER TABLE public.push_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.push_deliveries (event_id uuid NOT NULL REFERENCES public.push_events(id) ON DELETE CASCADE, subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, lease_until timestamptz, response_status integer, PRIMARY KEY(event_id,subscription_id));
GRANT ALL ON public.push_deliveries TO service_role;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.enqueue_web_push() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e uuid; owner_id uuid; k text; actor uuid; pid uuid;
BEGIN
 IF TG_TABLE_NAME = 'comments' THEN
   SELECT user_id INTO owner_id FROM public.posts WHERE id=NEW.post_id;
   IF owner_id IS NULL OR owner_id=NEW.user_id THEN RETURN NEW; END IF;
   k:='comment'; actor:=NEW.user_id; pid:=NEW.post_id;
 ELSIF TG_TABLE_NAME = 'posts' THEN k:='post'; actor:=NEW.user_id; pid:=NEW.id;
 ELSE k:='member'; actor:=NEW.id;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.push_subscriptions s WHERE s.user_id<>actor AND (owner_id IS NULL OR s.user_id=owner_id)) THEN RETURN NEW; END IF;
 INSERT INTO public.push_events(kind,actor_id,recipient_id,post_id) VALUES(k,actor,owner_id,pid) RETURNING id INTO e;
 INSERT INTO public.push_deliveries(event_id,subscription_id) SELECT e,s.id FROM public.push_subscriptions s WHERE s.user_id<>actor AND (owner_id IS NULL OR s.user_id=owner_id);
 PERFORM net.http_post(url:='https://project--7f2b2de9-0888-47fa-89d6-93cefa69597f.lovable.app/api/public/web-push', body:=(SELECT jsonb_build_object('eventId',id,'secret',secret) FROM public.push_events WHERE id=e), timeout_milliseconds:=10000);
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Web push enqueue failed: %',SQLSTATE; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_web_push() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER push_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.enqueue_web_push();
CREATE TRIGGER push_post AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.enqueue_web_push();
CREATE TRIGGER push_member AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enqueue_web_push();
CREATE FUNCTION public.claim_push_deliveries(_event uuid) RETURNS SETOF public.push_deliveries LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.push_deliveries SET status='sending',attempts=attempts+1,lease_until=now()+interval '2 minutes' WHERE event_id=_event AND attempts<5 AND (status IN ('pending','retry') OR (status='sending' AND lease_until<now())) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_push_deliveries(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_deliveries(uuid) TO service_role;