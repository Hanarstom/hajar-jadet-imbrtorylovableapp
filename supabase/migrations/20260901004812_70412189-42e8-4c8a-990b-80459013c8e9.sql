
alter table public.profiles
  add column if not exists country_code text,
  add column if not exists referral_code text,
  add column if not exists referred_by uuid,
  add column if not exists balance numeric(12,4) not null default 0;

update public.profiles set referral_code = upper(substr(replace(id::text,'-',''),1,8)) where referral_code is null;
create unique index if not exists profiles_referral_code_key on public.profiles(referral_code);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invited_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'verified',
  signup_reward_paid boolean not null default false,
  activity_reward_paid boolean not null default false,
  device_fingerprint text,
  created_at timestamptz not null default now()
);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
do $$ begin
  create policy "own referrals readable" on public.referrals for select to authenticated
    using (auth.uid() = inviter_id or auth.uid() = invited_id);
exception when duplicate_object then null; end $$;

create table if not exists public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now()::date),
  reels_posted integer not null default 0,
  watch_seconds integer not null default 0,
  primary key (user_id, day)
);
grant select on public.daily_activity to authenticated;
grant all on public.daily_activity to service_role;
alter table public.daily_activity enable row level security;
do $$ begin
  create policy "activity visible to self and inviter" on public.daily_activity for select to authenticated
    using (
      auth.uid() = user_id
      or exists (select 1 from public.referrals r where r.invited_id = daily_activity.user_id and r.inviter_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,4) not null,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
do $$ begin
  create policy "own transactions" on public.wallet_transactions for select to authenticated
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,4) not null,
  binance_id text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select on public.withdrawals to authenticated;
grant all on public.withdrawals to service_role;
alter table public.withdrawals enable row level security;
do $$ begin
  create policy "own withdrawals" on public.withdrawals for select to authenticated
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- signup: country, referral code, inviter link + anti-fraud + 0.01 signup reward
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
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
      update public.profiles set balance = balance + 0.01 where id = _inviter;
      insert into public.wallet_transactions (user_id, amount, kind, note)
      values (_inviter, 0.01, 'referral_signup', 'مكافأة تسجيل صديق');
      insert into public.notifications (user_id, actor_id, type, meta)
      values (_inviter, NEW.id, 'referral_signup', 'تم تسجيل صديق بدعوتك: +0.01$');
    end if;
  end if;

  return NEW;
end;
$function$;

-- evaluate the 0.04 activity reward
create or replace function public.evaluate_referral_activity(_user uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _r public.referrals;
  _a public.daily_activity;
begin
  select * into _r from public.referrals where invited_id = _user and activity_reward_paid = false and status = 'verified';
  if _r.id is null then return; end if;
  select * into _a from public.daily_activity where user_id = _user and day = now()::date;
  if _a.user_id is null or _a.reels_posted < 1 or _a.watch_seconds < 1800 then return; end if;

  update public.referrals set activity_reward_paid = true where id = _r.id;
  update public.profiles set balance = balance + 0.04 where id = _r.inviter_id;
  insert into public.wallet_transactions (user_id, amount, kind, note)
  values (_r.inviter_id, 0.04, 'referral_activity', 'مكافأة نشاط صديق مدعو');
  insert into public.notifications (user_id, actor_id, type, meta)
  values (_r.inviter_id, _user, 'referral_activity',
    '🎉 اكتملت دعوتك! تمت إضافة 0.04$ إلى رصيدك، هنيئًا لك عزيزي، استمر لتحصل على المزيد من الأرباح!');
end;
$$;

-- real watch time (client sends only active seconds)
create or replace function public.record_watch_time(_seconds integer)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or _seconds is null or _seconds <= 0 or _seconds > 120 then return; end if;
  insert into public.daily_activity (user_id, day, watch_seconds)
  values (auth.uid(), now()::date, _seconds)
  on conflict (user_id, day) do update set watch_seconds = public.daily_activity.watch_seconds + excluded.watch_seconds;
  perform public.evaluate_referral_activity(auth.uid());
end;
$$;
grant execute on function public.record_watch_time(integer) to authenticated;

create or replace function public.count_reel_post()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if NEW.video_url is not null then
    insert into public.daily_activity (user_id, day, reels_posted)
    values (NEW.user_id, now()::date, 1)
    on conflict (user_id, day) do update set reels_posted = public.daily_activity.reels_posted + 1;
    perform public.evaluate_referral_activity(NEW.user_id);
  end if;
  return NEW;
end;
$$;
drop trigger if exists posts_count_reel_activity on public.posts;
create trigger posts_count_reel_activity after insert on public.posts
for each row execute function public.count_reel_post();

-- secure withdrawal request
create or replace function public.request_withdrawal(_amount numeric, _binance_id text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare _bal numeric;
begin
  if auth.uid() is null then return 'يجب تسجيل الدخول'; end if;
  if _binance_id is null or length(trim(_binance_id)) < 4 then return 'أدخل معرّف Binance صحيح'; end if;
  select balance into _bal from public.profiles where id = auth.uid();
  if _amount is null or _amount < 10 then return 'الحد الأدنى للسحب 10$'; end if;
  if _bal < _amount then return 'رصيدك غير كافٍ'; end if;
  update public.profiles set balance = balance - _amount where id = auth.uid();
  insert into public.withdrawals (user_id, amount, binance_id) values (auth.uid(), _amount, trim(_binance_id));
  insert into public.wallet_transactions (user_id, amount, kind, note)
  values (auth.uid(), -_amount, 'withdrawal', 'طلب سحب عبر Binance');
  return 'ok';
end;
$$;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;
