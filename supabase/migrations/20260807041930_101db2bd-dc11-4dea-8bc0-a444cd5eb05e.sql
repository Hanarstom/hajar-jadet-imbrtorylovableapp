ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'youtube';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count bigint NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_views bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.post_views TO authenticated;
GRANT SELECT, INSERT ON public.post_views TO anon;
GRANT ALL ON public.post_views TO service_role;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_views_public_read" ON public.post_views FOR SELECT USING (true);
CREATE POLICY "post_views_insert_any" ON public.post_views FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.saves (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.saves TO authenticated;
GRANT ALL ON public.saves TO service_role;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_read_own" ON public.saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saves_insert_own" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saves_delete_own" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  meta text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_views_created_idx ON public.post_views(created_at DESC);

CREATE OR REPLACE FUNCTION public.register_post_view(_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = _post_id;
  IF _owner IS NULL THEN RETURN; END IF;
  INSERT INTO public.post_views (post_id, user_id) VALUES (_post_id, auth.uid());
  UPDATE public.posts SET views_count = views_count + 1 WHERE id = _post_id;
  UPDATE public.profiles SET total_views = total_views + 1 WHERE id = _owner;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_post_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_profile_view(_profile_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = _profile_id THEN RETURN; END IF;
  UPDATE public.profiles SET profile_views = profile_views + 1 WHERE id = _profile_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_profile_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.leaderboard_24h()
RETURNS TABLE (id uuid, username text, display_name text, avatar_url text, score bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pr.id, pr.username, pr.display_name, pr.avatar_url,
    (COALESCE(v.c, 0) + COALESCE(r.c, 0) * 3 + COALESCE(f.c, 0) * 5)::bigint AS score
  FROM public.profiles pr
  LEFT JOIN (
    SELECT p.user_id AS uid, count(*) AS c FROM public.post_views pv
    JOIN public.posts p ON p.id = pv.post_id
    WHERE pv.created_at > now() - interval '24 hours' GROUP BY p.user_id
  ) v ON v.uid = pr.id
  LEFT JOIN (
    SELECT p.user_id AS uid, count(*) AS c FROM public.reactions rc
    JOIN public.posts p ON p.id = rc.post_id
    WHERE rc.created_at > now() - interval '24 hours' GROUP BY p.user_id
  ) r ON r.uid = pr.id
  LEFT JOIN (
    SELECT following_id AS uid, count(*) AS c FROM public.follows
    WHERE created_at > now() - interval '24 hours' GROUP BY following_id
  ) f ON f.uid = pr.id
  WHERE (COALESCE(v.c,0) + COALESCE(r.c,0) + COALESCE(f.c,0)) > 0
  ORDER BY score DESC LIMIT 3;
$$;
GRANT EXECUTE ON FUNCTION public.leaderboard_24h() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.follower_id <> NEW.following_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type) VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_follow ON public.follows;
CREATE TRIGGER notify_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, meta)
    VALUES (_owner, NEW.user_id, 'comment', NEW.post_id, left(NEW.body, 80));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_comment ON public.comments;
CREATE TRIGGER notify_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, meta)
    VALUES (_owner, NEW.user_id, 'reaction', NEW.post_id, NEW.type::text);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_reaction ON public.reactions;
CREATE TRIGGER notify_reaction AFTER INSERT OR UPDATE ON public.reactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_reaction();