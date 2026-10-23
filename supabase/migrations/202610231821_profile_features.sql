create extension if not exists "pgcrypto";

do $$
begin
  create type contribution_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists "Accounts" (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table "Accounts" add column if not exists full_name text;
alter table "Accounts" add column if not exists avatar_url text;
alter table "Accounts" add column if not exists created_at timestamptz not null default now();

create table if not exists "SearchHistory" (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references "Accounts"(id) on delete cascade,
  search_query text not null,
  searched_at timestamptz not null default now()
);

create table if not exists "UserFavorites" (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references "Accounts"(id) on delete cascade,
  word_id uuid not null references "Words"(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (account_id, word_id)
);

create table if not exists "WordContributions" (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references "Accounts"(id) on delete cascade,
  word text not null,
  definition text not null,
  part_of_speech text,
  phonetic text,
  status contribution_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function update_word_contributions_modtime()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_word_contributions_modtime on "WordContributions";
create trigger update_word_contributions_modtime
before update on "WordContributions"
for each row execute function update_word_contributions_modtime();

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

drop trigger if exists on_auth_user_created_account on auth.users;
create trigger on_auth_user_created_account
after insert on auth.users
for each row execute function handle_new_user_account();

create index if not exists search_history_account_searched_at_idx on "SearchHistory" (account_id, searched_at desc);
create index if not exists user_favorites_account_created_at_idx on "UserFavorites" (account_id, created_at desc);
create index if not exists word_contributions_account_created_at_idx on "WordContributions" (account_id, created_at desc);

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

alter table "Accounts" enable row level security;
alter table "SearchHistory" enable row level security;
alter table "UserFavorites" enable row level security;
alter table "WordContributions" enable row level security;
alter table "Words" enable row level security;

drop policy if exists "Cho phép user tạo tài khoản của chính mình" on "Accounts";
create policy "Cho phép user tạo tài khoản của chính mình" on "Accounts"
for insert with check (auth.uid() = id);
drop policy if exists "Cho phép xem thông tin tài khoản công khai" on "Accounts";
create policy "Cho phép xem thông tin tài khoản công khai" on "Accounts"
for select using (true);
drop policy if exists "Chỉ user được cập nhật tài khoản của chính mình" on "Accounts";
create policy "Chỉ user được cập nhật tài khoản của chính mình" on "Accounts"
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can view own search history" on "SearchHistory";
create policy "Users can view own search history" on "SearchHistory" for select using (auth.uid() = account_id);
drop policy if exists "Users can insert own search history" on "SearchHistory";
create policy "Users can insert own search history" on "SearchHistory" for insert with check (auth.uid() = account_id);
drop policy if exists "Users can delete own search history" on "SearchHistory";
create policy "Users can delete own search history" on "SearchHistory" for delete using (auth.uid() = account_id);

drop policy if exists "Users can view own favorites" on "UserFavorites";
create policy "Users can view own favorites" on "UserFavorites" for select using (auth.uid() = account_id);
drop policy if exists "Users can insert own favorites" on "UserFavorites";
create policy "Users can insert own favorites" on "UserFavorites" for insert with check (auth.uid() = account_id);
drop policy if exists "Users can delete own favorites" on "UserFavorites";
create policy "Users can delete own favorites" on "UserFavorites" for delete using (auth.uid() = account_id);

drop policy if exists "Anyone can view approved contributions or own" on "WordContributions";
create policy "Anyone can view approved contributions or own" on "WordContributions"
for select using (status = 'approved' or auth.uid() = account_id or is_admin());
drop policy if exists "Users can insert own contributions" on "WordContributions";
create policy "Users can insert own contributions" on "WordContributions"
for insert with check (auth.uid() = account_id and status = 'pending');
drop policy if exists "Users can update own pending contributions" on "WordContributions";
create policy "Users can update own pending contributions" on "WordContributions"
for update using (auth.uid() = account_id and status = 'pending')
with check (auth.uid() = account_id and status = 'pending');
drop policy if exists "Users can delete own pending contributions" on "WordContributions";
create policy "Users can delete own pending contributions" on "WordContributions"
for delete using (auth.uid() = account_id and status = 'pending');
drop policy if exists "Admins can moderate contributions" on "WordContributions";
create policy "Admins can moderate contributions" on "WordContributions"
for update using (is_admin()) with check (is_admin());

drop policy if exists "Cho phep tat ca moi nguoi xem tu vuc" on "Words";
create policy "Cho phep tat ca moi nguoi xem tu vuc" on "Words" for select using (true);
