
revoke all on function public.evaluate_referral_activity(uuid) from public, anon, authenticated;
revoke all on function public.count_reel_post() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.record_watch_time(integer) from public, anon;
revoke all on function public.request_withdrawal(numeric, text) from public, anon;
grant execute on function public.record_watch_time(integer) to authenticated;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;
