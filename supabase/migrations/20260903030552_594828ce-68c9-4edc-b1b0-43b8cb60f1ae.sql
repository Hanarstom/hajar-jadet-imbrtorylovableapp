alter table public.profiles
  add column if not exists gender text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists verification_status text not null default 'none',
  add column if not exists reels_watched integer not null default 0;

create table if not exists public.verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gender text not null,
  photo_path text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert, update on public.verifications to authenticated;
grant all on public.verifications to service_role;
alter table public.verifications enable row level security;
create policy verifications_own_read on public.verifications for select to authenticated using (auth.uid() = user_id);

create table if not exists public.reel_watches (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
grant select, insert on public.reel_watches to authenticated;
grant all on public.reel_watches to service_role;
alter table public.reel_watches enable row level security;
create policy reel_watches_own_read on public.reel_watches for select to authenticated using (auth.uid() = user_id);
create policy reel_watches_insert_own on public.reel_watches for insert to authenticated with check (auth.uid() = user_id);

create or replace function public.submit_verification(_gender text, _photo_path text)
returns text language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null then return 'يجب تسجيل الدخول'; end if;
  if _gender not in ('male','female') then return 'اختر الجنس'; end if;
  if _photo_path is null or length(_photo_path) < 3 then return 'الصورة مطلوبة'; end if;
  insert into public.verifications (user_id, gender, photo_path, status)
  values (auth.uid(), _gender, _photo_path, 'pending')
  on conflict (user_id) do update set gender = excluded.gender, photo_path = excluded.photo_path,
    status = 'pending', created_at = now(), reviewed_at = null;
  update public.profiles set gender = _gender, verification_status = 'pending', is_verified = false
  where id = auth.uid();
  return 'ok';
end; $fn$;

create or replace function public.admin_pending_verifications(_pass text)
returns table(user_id uuid, username text, display_name text, gender text, photo_path text, created_at timestamptz)
language plpgsql stable security definer set search_path to 'public' as $fn$
begin
  if _pass is distinct from ('1995@@hana1995' || '$' || '$') then return; end if;
  return query
    select v.user_id, p.username, p.display_name, v.gender, v.photo_path, v.created_at
    from public.verifications v join public.profiles p on p.id = v.user_id
    where v.status = 'pending' order by v.created_at asc limit 100;
end; $fn$;

create or replace function public.admin_review_verification(_pass text, _user uuid, _approve boolean)
returns text language plpgsql security definer set search_path to 'public' as $fn$
begin
  if _pass is distinct from ('1995@@hana1995' || '$' || '$') then return 'كلمة السر غير صحيحة'; end if;
  update public.verifications set status = case when _approve then 'approved' else 'rejected' end,
    reviewed_at = now() where user_id = _user;
  update public.profiles set is_verified = _approve,
    verification_status = case when _approve then 'approved' else 'rejected' end
  where id = _user;
  insert into public.notifications (user_id, type, meta)
  values (_user, 'verification',
    case when _approve then '🛡️ تم توثيق حسابك بحماية غوغل' else 'تم رفض طلب التوثيق، أعد المحاولة بصورة أوضح' end);
  if _approve then perform public.evaluate_referral_activity(_user); end if;
  return 'ok';
end; $fn$;

create or replace function public.register_reel_watch(_post_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null or _post_id is null then return; end if;
  insert into public.reel_watches (user_id, post_id) values (auth.uid(), _post_id)
  on conflict do nothing;
  if found then
    update public.profiles set reels_watched = reels_watched + 1 where id = auth.uid();
    perform public.evaluate_referral_activity(auth.uid());
  end if;
end; $fn$;

create or replace function public.evaluate_referral_activity(_user uuid)
returns void language plpgsql security definer set search_path to 'public' as $fn$
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
  update public.profiles set balance = balance + 0.002 where id = _r.inviter_id;
  insert into public.wallet_transactions (user_id, amount, kind, note)
  values (_r.inviter_id, 0.002, 'referral_activity', 'مكافأة نشاط صديق موثق');
  insert into public.notifications (user_id, actor_id, type, meta)
  values (_r.inviter_id, _user, 'referral_activity',
    '🎉 صديقك أصبح موثقًا وأكمل 60 ريلز! تمت إضافة 0.002$ إلى رصيدك');
end; $fn$;