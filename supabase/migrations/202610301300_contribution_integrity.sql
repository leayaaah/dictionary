alter table public."WordContributions"
  add column if not exists reviewed_by uuid references public."Accounts"(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists published_word_id uuid references public."Words"(id) on delete set null,
  add column if not exists admin_note text;

create index if not exists word_contributions_status_created_at_idx
  on public."WordContributions" (status, created_at desc);

-- Users may submit and delete their own pending rows. All updates go through the
-- SECURITY DEFINER moderation functions so status and review metadata stay trusted.
drop policy if exists "Users can update own pending contributions" on public."WordContributions";
drop policy if exists "Admins can moderate contributions" on public."WordContributions";
drop policy if exists "Users can insert own contributions" on public."WordContributions";

create or replace function public.submit_contribution(contribution_data jsonb)
returns public."WordContributions"
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  clean_word text := regexp_replace(btrim(coalesce(contribution_data ->> 'word', '')), '\s+', ' ', 'g');
  clean_definition text := regexp_replace(btrim(coalesce(contribution_data ->> 'definition', '')), '\s+', ' ', 'g');
  clean_pos text := regexp_replace(btrim(coalesce(contribution_data ->> 'part_of_speech', '')), '\s+', ' ', 'g');
  clean_phonetic text := regexp_replace(btrim(coalesce(contribution_data ->> 'phonetic', '')), '\s+', ' ', 'g');
  inserted public."WordContributions"%rowtype;
begin
  if current_user_id is null then raise exception 'Bạn cần đăng nhập để gửi đóng góp.' using errcode = '42501'; end if;
  if clean_word = '' then raise exception 'Vui lòng nhập từ vựng.' using errcode = '22023'; end if;
  if clean_definition = '' then raise exception 'Vui lòng nhập định nghĩa.' using errcode = '22023'; end if;
  if char_length(clean_word) > 100 then raise exception 'Từ vựng tối đa 100 ký tự.' using errcode = '22023'; end if;
  if char_length(clean_definition) > 1000 then raise exception 'Định nghĩa tối đa 1000 ký tự.' using errcode = '22023'; end if;
  if char_length(clean_pos) > 50 then raise exception 'Từ loại tối đa 50 ký tự.' using errcode = '22023'; end if;
  if char_length(clean_phonetic) > 100 then raise exception 'Phiên âm tối đa 100 ký tự.' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    current_user_id::text || ':' || lower(clean_word) || ':' || lower(clean_definition), 1));

  if exists (select 1 from public."Words" where lower(regexp_replace(btrim(word_st), '\s+', ' ', 'g')) = lower(clean_word)) then
    raise exception 'Từ này đã có trong từ điển.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public."WordContributions"
    where account_id = current_user_id and status = 'pending'
      and lower(regexp_replace(btrim(word), '\s+', ' ', 'g')) = lower(clean_word)
      and lower(regexp_replace(btrim(definition), '\s+', ' ', 'g')) = lower(clean_definition)
  ) then raise exception 'Bạn đã gửi một đóng góp tương tự và đang chờ duyệt.' using errcode = '23505'; end if;

  insert into public."WordContributions" (account_id, word, definition, part_of_speech, phonetic, status)
  values (current_user_id, clean_word, clean_definition, nullif(clean_pos, ''), nullif(clean_phonetic, ''), 'pending')
  returning * into inserted;
  return inserted;
end;
$$;

create or replace function public.approve_contribution(contribution_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  contribution public."WordContributions"%rowtype;
  published_id uuid;
begin
  if not public.is_admin() then raise exception 'Bạn không có quyền duyệt đóng góp.' using errcode = '42501'; end if;

  select * into contribution
  from public."WordContributions"
  where id = contribution_id
  for update;
  if not found then raise exception 'Không tìm thấy đóng góp.' using errcode = 'P0002'; end if;
  if contribution.status <> 'pending' then raise exception 'Đóng góp này đã được xử lý.' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    lower(regexp_replace(btrim(contribution.word), '\s+', ' ', 'g')), 0));
  select id into published_id from public."Words"
  where lower(regexp_replace(btrim(word_st), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(contribution.word), '\s+', ' ', 'g'))
  order by id limit 1;
  if published_id is null then
    insert into public."Words" (word_st, meaning, pos)
    values (trim(contribution.word), trim(contribution.definition), nullif(trim(contribution.part_of_speech), ''))
    returning id into published_id;
  end if;

  update public."WordContributions"
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), published_word_id = published_id
  where id = contribution_id and status = 'pending';
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

revoke all on function public.submit_contribution(jsonb) from public;
revoke all on function public.approve_contribution(uuid) from public;
revoke all on function public.reject_contribution(uuid, text) from public;
grant execute on function public.submit_contribution(jsonb) to authenticated;
grant execute on function public.approve_contribution(uuid) to authenticated;
grant execute on function public.reject_contribution(uuid, text) to authenticated;
