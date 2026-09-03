revoke execute on function public.submit_verification(text, text) from anon;
revoke execute on function public.register_reel_watch(uuid) from anon;
revoke execute on function public.admin_pending_verifications(text) from anon;
revoke execute on function public.admin_review_verification(text, uuid, boolean) from anon;
revoke execute on function public.evaluate_referral_activity(uuid) from anon, authenticated;