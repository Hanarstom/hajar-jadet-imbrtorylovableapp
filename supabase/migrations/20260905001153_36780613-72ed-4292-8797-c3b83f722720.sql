DO $mig$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END
$mig$;

-- Member-only RPCs
GRANT EXECUTE ON FUNCTION public.submit_verification(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_watch_time(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_reel_watch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_presence() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_followers(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_24h() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_profile_view(uuid) TO authenticated;

-- Public view counting for guests browsing reels
GRANT EXECUTE ON FUNCTION public.register_post_view(uuid) TO anon, authenticated;