ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.touch_presence()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET last_seen_at = now(), is_online = true
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.touch_presence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_presence() TO authenticated;