ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

DELETE FROM public.post_views pv USING public.post_views older
WHERE pv.user_id IS NOT NULL AND older.user_id = pv.user_id
  AND older.post_id = pv.post_id AND older.created_at <= pv.created_at AND older.id <> pv.id
  AND (older.created_at < pv.created_at OR older.id < pv.id);

CREATE UNIQUE INDEX IF NOT EXISTS post_views_unique_user ON public.post_views (post_id, user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.register_post_view(_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = _post_id;
  IF _owner IS NULL THEN RETURN; END IF;
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.post_views WHERE post_id = _post_id AND user_id = auth.uid()
  ) THEN RETURN; END IF;
  INSERT INTO public.post_views (post_id, user_id) VALUES (_post_id, auth.uid());
  UPDATE public.posts SET views_count = views_count + 1 WHERE id = _post_id;
  UPDATE public.profiles SET total_views = total_views + 1 WHERE id = _owner;
END; $$;

CREATE OR REPLACE FUNCTION public.touch_presence()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles SET last_seen_at = now() WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.notify_followers(_type text, _post_id uuid, _meta text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, post_id, meta)
  SELECT f.follower_id, auth.uid(), _type, _post_id, left(coalesce(_meta, ''), 120)
  FROM public.follows f WHERE f.following_id = auth.uid();
END; $$;

CREATE TABLE IF NOT EXISTS public.platform_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_ads TO authenticated;
GRANT ALL ON public.platform_ads TO service_role;

ALTER TABLE public.platform_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_ads_public_read" ON public.platform_ads FOR SELECT USING (true);
CREATE POLICY "platform_ads_insert_own" ON public.platform_ads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "platform_ads_update_own" ON public.platform_ads FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "platform_ads_delete_own" ON public.platform_ads FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_platform_ads_updated_at ON public.platform_ads;
CREATE TRIGGER update_platform_ads_updated_at BEFORE UPDATE ON public.platform_ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();