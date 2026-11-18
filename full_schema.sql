-- Baseline squashed from the seven migrations dated 2026-10-23 through 2026-10-30.
-- Run in a Supabase project with auth and storage schemas installed.
-- The definition of public."Words" and pre-existing defaults/constraints were
-- checked against original_schema.sql exported from the source database.
-- That dump excludes Supabase-managed auth and storage schema objects.

-- 1. Extensions and custom types.
create extension if not exists "pgcrypto";

do $$
begin
  create type public.contribution_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- 2. Tables, keys, and relationships.
create table if not exists public."Words" (
  id uuid primary key default gen_random_uuid(),
  word_vi text,
  word_st text,
  pos text,
  meaning text,
  example text,
  phonetic text
);

create table if not exists public."Accounts" (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public."SearchHistory" (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public."Accounts"(id) on delete cascade,
  search_query text not null,
  searched_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public."UserFavorites" (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public."Accounts"(id) on delete cascade,
  word_id uuid not null references public."Words"(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint unique_user_word_favorite unique (account_id, word_id)
);

create table if not exists public."WordContributions" (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public."Accounts"(id) on delete cascade,
  word text not null,
  definition text not null,
  part_of_speech text,
  phonetic text,
  status public.contribution_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_by uuid references public."Accounts"(id),
  reviewed_at timestamptz,
  published_word_id uuid references public."Words"(id),
  word_vi text,
  example text,
  word_st text,
  meaning text,
  pos text
);

-- 3. Indexes.
create index if not exists search_history_account_searched_at_idx
  on public."SearchHistory" (account_id, searched_at desc);
create index if not exists user_favorites_account_created_at_idx
  on public."UserFavorites" (account_id, created_at desc);
create index if not exists word_contributions_account_created_at_idx
  on public."WordContributions" (account_id, created_at desc);
create index if not exists word_contributions_status_created_at_idx
  on public."WordContributions" (status, created_at desc);

-- 4. Latest functions and triggers.
create or replace function update_word_contributions_modtime()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function handle_new_user_account()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Accounts" (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.submit_contribution(contribution_data jsonb)
returns public."WordContributions"
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  clean_word_st text := regexp_replace(btrim(coalesce(contribution_data ->> 'word_st', '')), '\s+', ' ', 'g');
  clean_word_vi text := regexp_replace(btrim(coalesce(contribution_data ->> 'word_vi', '')), '\s+', ' ', 'g');
  clean_pos text := regexp_replace(btrim(coalesce(contribution_data ->> 'pos', '')), '\s+', ' ', 'g');
  clean_meaning text := regexp_replace(btrim(coalesce(contribution_data ->> 'meaning', '')), '\s+', ' ', 'g');
  clean_example text := regexp_replace(btrim(coalesce(contribution_data ->> 'example', '')), '\s+', ' ', 'g');
  clean_phonetic text := regexp_replace(btrim(coalesce(contribution_data ->> 'phonetic', '')), '\s+', ' ', 'g');
  inserted public."WordContributions"%rowtype;
begin
  if current_user_id is null then raise exception 'Bạn cần đăng nhập để gửi đóng góp.' using errcode = '42501'; end if;
  if clean_word_st = '' or clean_word_vi = '' or clean_meaning = '' then raise exception 'Từ tiếng, nghĩa tiếng Việt và định nghĩa là bắt buộc.' using errcode = '22023'; end if;
  if char_length(clean_word_st) > 100 or char_length(clean_word_vi) > 100 or char_length(clean_meaning) > 1000 or char_length(clean_pos) > 50 or char_length(clean_example) > 1000 or char_length(clean_phonetic) > 100 then
    raise exception 'Nội dung đóng góp vượt quá giới hạn cho phép.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || lower(clean_word_st) || ':' || lower(clean_word_vi) || ':' || lower(clean_meaning), 1));
  if exists (select 1 from public."Words" where lower(regexp_replace(btrim(word_st), '\s+', ' ', 'g')) = lower(clean_word_st)) then raise exception 'Từ này đã có trong từ điển.' using errcode = '23505'; end if;
  if exists (select 1 from public."WordContributions" where account_id = current_user_id and status = 'pending' and lower(regexp_replace(btrim(coalesce(word_st, word)), '\s+', ' ', 'g')) = lower(clean_word_st) and lower(regexp_replace(btrim(coalesce(word_vi, '')), '\s+', ' ', 'g')) = lower(clean_word_vi) and lower(regexp_replace(btrim(coalesce(meaning, definition)), '\s+', ' ', 'g')) = lower(clean_meaning)) then
    raise exception 'Bạn đã gửi một đóng góp tương tự và đang chờ duyệt.' using errcode = '23505';
  end if;
  insert into public."WordContributions" (account_id, word_st, word_vi, pos, meaning, example, phonetic, word, definition, part_of_speech, status)
  values (current_user_id, clean_word_st, clean_word_vi, nullif(clean_pos, ''), clean_meaning, nullif(clean_example, ''), nullif(clean_phonetic, ''), clean_word_st, clean_meaning, nullif(clean_pos, ''), 'pending')
  returning * into inserted;
  return inserted;
end;
$$;

create or replace function public.update_contribution(contribution_id uuid, contribution_data jsonb)
returns public."WordContributions"
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  updated public."WordContributions"%rowtype;
  clean_word_st text := regexp_replace(btrim(coalesce(contribution_data ->> 'word_st', '')), '\s+', ' ', 'g');
  clean_word_vi text := regexp_replace(btrim(coalesce(contribution_data ->> 'word_vi', '')), '\s+', ' ', 'g');
  clean_pos text := regexp_replace(btrim(coalesce(contribution_data ->> 'pos', '')), '\s+', ' ', 'g');
  clean_meaning text := regexp_replace(btrim(coalesce(contribution_data ->> 'meaning', '')), '\s+', ' ', 'g');
  clean_example text := regexp_replace(btrim(coalesce(contribution_data ->> 'example', '')), '\s+', ' ', 'g');
  clean_phonetic text := regexp_replace(btrim(coalesce(contribution_data ->> 'phonetic', '')), '\s+', ' ', 'g');
begin
  if not public.is_admin() then raise exception 'Bạn không có quyền chỉnh sửa đóng góp.' using errcode = '42501'; end if;
  if clean_word_st = '' or clean_word_vi = '' or clean_meaning = '' then raise exception 'Từ tiếng, nghĩa tiếng Việt và định nghĩa là bắt buộc.' using errcode = '22023'; end if;
  if char_length(clean_word_st) > 100 or char_length(clean_word_vi) > 100 or char_length(clean_meaning) > 1000 or char_length(clean_pos) > 50 or char_length(clean_example) > 1000 or char_length(clean_phonetic) > 100 then raise exception 'Nội dung đóng góp vượt quá giới hạn cho phép.' using errcode = '22023'; end if;
  update public."WordContributions"
  set word_st = clean_word_st, word_vi = clean_word_vi, pos = nullif(clean_pos, ''), meaning = clean_meaning, example = nullif(clean_example, ''), phonetic = nullif(clean_phonetic, ''), word = clean_word_st, definition = clean_meaning, part_of_speech = nullif(clean_pos, '')
  where id = contribution_id and status = 'pending'
  returning * into updated;
  if not found then raise exception 'Chỉ có thể chỉnh sửa đóng góp đang chờ duyệt.' using errcode = 'P0002'; end if;
  return updated;
end;
$$;

create or replace function public.approve_contribution(contribution_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare contribution public."WordContributions"%rowtype; published_id uuid;
begin
  if not public.is_admin() then raise exception 'Bạn không có quyền duyệt đóng góp.' using errcode = '42501'; end if;
  select * into contribution from public."WordContributions" where id = contribution_id for update;
  if not found then raise exception 'Không tìm thấy đóng góp.' using errcode = 'P0002'; end if;
  if contribution.status <> 'pending' then raise exception 'Đóng góp này đã được xử lý.' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(regexp_replace(btrim(contribution.word_st), '\s+', ' ', 'g')), 0));
  select id into published_id from public."Words" where lower(regexp_replace(btrim(word_st), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(contribution.word_st), '\s+', ' ', 'g')) order by id limit 1;
  if published_id is null then
    insert into public."Words" (word_st, word_vi, pos, meaning, example, phonetic)
    values (trim(contribution.word_st), trim(contribution.word_vi), nullif(trim(contribution.pos), ''), trim(contribution.meaning), nullif(trim(contribution.example), ''), nullif(trim(contribution.phonetic), ''))
    returning id into published_id;
  end if;
  update public."WordContributions" set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), published_word_id = published_id where id = contribution_id and status = 'pending';
  if not found then raise exception 'Đóng góp này đã được xử lý.' using errcode = '22023'; end if;
  return published_id;
end;
$$;

create or replace function public.reject_contribution(contribution_id uuid, note text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Bạn không có quyền từ chối đóng góp.' using errcode = '42501'; end if;
  if nullif(trim(note), '') is null then raise exception 'Vui lòng nhập lý do từ chối.' using errcode = '22023'; end if;

  update public."WordContributions"
  set status = 'rejected', admin_note = trim(note), reviewed_by = auth.uid(), reviewed_at = now()
  where id = contribution_id and status = 'pending';
  if not found then raise exception 'Không tìm thấy đóng góp đang chờ duyệt.' using errcode = 'P0002'; end if;
end;
$$;

drop trigger if exists update_word_contributions_modtime on public."WordContributions";
create trigger update_word_contributions_modtime
before update on public."WordContributions"
for each row execute function public.update_word_contributions_modtime();

drop trigger if exists on_auth_user_created_account on auth.users;
create trigger on_auth_user_created_account
after insert on auth.users
for each row execute function public.handle_new_user_account();

-- 5. Storage bucket and storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "Users can upload own profile avatars" on storage.objects;
create policy "Users can upload own profile avatars" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can view own profile avatar objects" on storage.objects;
create policy "Users can view own profile avatar objects" on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own profile avatars" on storage.objects;
create policy "Users can delete own profile avatars" on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 6. Table RLS and final policies.
alter table public."Accounts" enable row level security;
alter table public."SearchHistory" enable row level security;
alter table public."UserFavorites" enable row level security;
alter table public."WordContributions" enable row level security;
alter table public."Words" enable row level security;

drop policy if exists "Cho phép user tạo tài khoản của chính mình" on public."Accounts";
create policy "Cho phép user tạo tài khoản của chính mình" on public."Accounts"
for insert with check (auth.uid() = id);
drop policy if exists "Cho phép xem thông tin tài khoản công khai" on public."Accounts";
create policy "Cho phép xem thông tin tài khoản công khai" on public."Accounts"
for select using (true);
-- PostgreSQL truncates the longer migration name at the 63-byte identifier limit.
drop policy if exists "Chỉ user được cập nhật tài khoản của chính mìn" on public."Accounts";
create policy "Chỉ user được cập nhật tài khoản của chính mìn" on public."Accounts"
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can view own search history" on public."SearchHistory";
create policy "Users can view own search history" on public."SearchHistory"
for select using (auth.uid() = account_id);
drop policy if exists "Users can insert own search history" on public."SearchHistory";
create policy "Users can insert own search history" on public."SearchHistory"
for insert with check (auth.uid() = account_id);
drop policy if exists "Users can delete own search history" on public."SearchHistory";
create policy "Users can delete own search history" on public."SearchHistory"
for delete using (auth.uid() = account_id);

drop policy if exists "Users can view own favorites" on public."UserFavorites";
create policy "Users can view own favorites" on public."UserFavorites"
for select using (auth.uid() = account_id);
drop policy if exists "Users can insert own favorites" on public."UserFavorites";
create policy "Users can insert own favorites" on public."UserFavorites"
for insert with check (auth.uid() = account_id);
drop policy if exists "Users can delete own favorites" on public."UserFavorites";
create policy "Users can delete own favorites" on public."UserFavorites"
for delete using (auth.uid() = account_id);

drop policy if exists "Anyone can view approved contributions or own" on public."WordContributions";
create policy "Anyone can view approved contributions or own" on public."WordContributions"
for select using (status = 'approved' or auth.uid() = account_id or public.is_admin());
drop policy if exists "Users can insert own contributions" on public."WordContributions";
drop policy if exists "Users can update own pending contributions" on public."WordContributions";
drop policy if exists "Admins can moderate contributions" on public."WordContributions";
drop policy if exists "Users can delete own pending contributions" on public."WordContributions";
create policy "Users can delete own pending contributions" on public."WordContributions"
for delete using (auth.uid() = account_id and status = 'pending');

drop policy if exists "Cho phep tat ca moi nguoi xem tu vuc" on public."Words";
create policy "Cho phep tat ca moi nguoi xem tu vuc" on public."Words"
for select using (true);

-- 7. RPC privileges and PostgREST schema cache.
revoke all on function public.submit_contribution(jsonb) from public;
revoke all on function public.update_contribution(uuid, jsonb) from public;
revoke all on function public.approve_contribution(uuid) from public;
revoke all on function public.reject_contribution(uuid, text) from public;
-- The source dump has direct anon grants; revoking PUBLIC alone leaves those in place.
revoke all on function public.submit_contribution(jsonb) from anon;
revoke all on function public.update_contribution(uuid, jsonb) from anon;
revoke all on function public.approve_contribution(uuid) from anon;
revoke all on function public.reject_contribution(uuid, text) from anon;
grant execute on function public.submit_contribution(jsonb) to authenticated;
grant execute on function public.update_contribution(uuid, jsonb) to authenticated;
grant execute on function public.approve_contribution(uuid) to authenticated;
grant execute on function public.reject_contribution(uuid, text) to authenticated;

notify pgrst, 'reload schema';
