REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_reaction() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_reel_post() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.leaderboard_24h() FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_profile_view(uuid) FROM anon;