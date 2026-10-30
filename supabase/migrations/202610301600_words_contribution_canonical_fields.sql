-- Canonicalize contribution content fields without dropping legacy columns.
-- The legacy columns remain available until a separate, explicitly approved cleanup.
alter table public."Words"
  add column if not exists phonetic text;

alter table public."WordContributions"
  add column if not exists word_st text,
  add column if not exists meaning text,
  add column if not exists pos text;

update public."Words"
set phonetic = nullif(trim(phonetic), '')
where phonetic is not null;

update public."WordContributions"
set word_st = coalesce(nullif(trim(word_st), ''), nullif(trim(word), '')),
    meaning = coalesce(nullif(trim(meaning), ''), nullif(trim(definition), '')),
    pos = coalesce(nullif(trim(pos), ''), nullif(trim(part_of_speech), ''))
where word_st is null or meaning is null or pos is null;

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

revoke all on function public.submit_contribution(jsonb) from public;
revoke all on function public.update_contribution(uuid, jsonb) from public;
revoke all on function public.approve_contribution(uuid) from public;
revoke all on function public.reject_contribution(uuid, text) from public;
grant execute on function public.submit_contribution(jsonb) to authenticated;
grant execute on function public.update_contribution(uuid, jsonb) to authenticated;
grant execute on function public.approve_contribution(uuid) to authenticated;
grant execute on function public.reject_contribution(uuid, text) to authenticated;

notify pgrst, 'reload schema';
