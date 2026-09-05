-- 1) Wallet balances split out of the publicly readable profiles table
CREATE TABLE IF NOT EXISTS public.user_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0
);

GRANT SELECT ON public.user_balances TO authenticated;
GRANT ALL ON public.user_balances TO service_role;

ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_balances_own_read ON public.user_balances;
CREATE POLICY user_balances_own_read ON public.user_balances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.user_balances (user_id, balance)
SELECT id, balance FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS balance;

-- 2) Functions updated to use the private balances table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
declare
  _inviter uuid;
  _fp text := nullif(NEW.raw_user_meta_data->>'device_fingerprint','');
  _status text := 'verified';
begin
  insert into public.profiles (id, username, display_name, country_code, referral_code)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    nullif(NEW.raw_user_meta_data->>'country_code',''),
    upper(substr(replace(NEW.id::text,'-',''),1,8))
  )
  on conflict (id) do nothing;

  insert into public.user_balances (user_id, balance) values (NEW.id, 0)
  on conflict (user_id) do nothing;

  select id into _inviter from public.profiles
  where referral_code = upper(nullif(NEW.raw_user_meta_data->>'referral_code',''))
  limit 1;

  if _inviter is not null and _inviter <> NEW.id then
    if _fp is not null and exists (select 1 from public.referrals where device_fingerprint = _fp) then
      _status := 'suspicious';
    end if;
    if exists (
      select 1 from public.referrals
      where inviter_id = _inviter and created_at > now() - interval '10 minutes'
      group by inviter_id having count(*) >= 5
    ) then
      _status := 'suspicious';
    end if;

    update public.profiles set referred_by = _inviter where id = NEW.id;

    insert into public.referrals (inviter_id, invited_id, status, device_fingerprint, signup_reward_paid)
    values (_inviter, NEW.id, _status, _fp, _status = 'verified')
    on conflict (invited_id) do nothing;

    if _status = 'verified' then
      insert into public.user_balances (user_id, balance) values (_inviter, 0.01)
      on conflict (user_id) do update set balance = public.user_balances.balance + 0.01;
      insert into public.wallet_transactions (user_id, amount, kind, note)
      values (_inviter, 0.01, 'referral_signup', 'مكافأة تسجيل صديق');
      insert into public.notifications (user_id, actor_id, type, meta)
      values (_inviter, NEW.id, 'referral_signup', 'تم تسجيل صديق بدعوتك: +0.01$');
    end if;
  end if;

  return NEW;
end;
$fn$;

CREATE OR REPLACE FUNCTION public.evaluate_referral_activity(_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
declare
  _r public.referrals;
  _p public.profiles;
begin
  select * into _r from public.referrals
  where invited_id = _user and activity_reward_paid = false and status = 'verified';
  if _r.id is null then return; end if;
  select * into _p from public.profiles where id = _user;
  if _p.id is null or _p.is_verified = false or coalesce(_p.reels_watched,0) < 60 then return; end if;

  update public.referrals set activity_reward_paid = true where id = _r.id;
  insert into public.user_balances (user_id, balance) values (_r.inviter_id, 0.002)
  on conflict (user_id) do update set balance = public.user_balances.balance + 0.002;
  insert into public.wallet_transactions (user_id, amount, kind, note)
  values (_r.inviter_id, 0.002, 'referral_activity', 'مكافأة نشاط صديق موثق');
  insert into public.notifications (user_id, actor_id, type, meta)
  values (_r.inviter_id, _user, 'referral_activity',
    '🎉 صديقك أصبح موثقًا وأكمل 60 ريلز! تمت إضافة 0.002$ إلى رصيدك');
end;
$fn$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _binance_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
declare _bal numeric;
begin
  if auth.uid() is null then return 'يجب تسجيل الدخول'; end if;
  if _binance_id is null or length(trim(_binance_id)) < 4 then return 'أدخل معرّف Binance صحيح'; end if;
  select balance into _bal from public.user_balances where user_id = auth.uid();
  _bal := coalesce(_bal, 0);
  if _amount is null or _amount < 10 then return 'الحد الأدنى للسحب 10$'; end if;
  if _bal < _amount then return 'رصيدك غير كافٍ'; end if;
  update public.user_balances set balance = balance - _amount where user_id = auth.uid();
  insert into public.withdrawals (user_id, amount, binance_id) values (auth.uid(), _amount, trim(_binance_id));
  insert into public.wallet_transactions (user_id, amount, kind, note)
  values (auth.uid(), -_amount, 'withdrawal', 'طلب سحب عبر Binance');
  return 'ok';
end;
$fn$;

-- 3) Admin RPCs removed from the exposed API schema (replaced by server-side checks)
DROP FUNCTION IF EXISTS public.admin_pending_verifications(text);
DROP FUNCTION IF EXISTS public.admin_review_verification(text, uuid, boolean);

-- 4) Sensitive SECURITY DEFINER functions are no longer callable by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_verification(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_watch_time(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_reel_watch(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_presence() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_followers(text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_referral_activity(uuid) FROM anon, authenticated;

-- 5) Private verification selfies are owner-only in storage
DROP POLICY IF EXISTS media_read_all ON storage.objects;

CREATE POLICY media_read_non_private ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'media'
    AND coalesce((storage.foldername(name))[2], '') <> 'verify'
  );

CREATE POLICY media_read_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );