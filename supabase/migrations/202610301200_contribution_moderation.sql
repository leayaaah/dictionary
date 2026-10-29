alter table public."WordContributions"
  add column if not exists reviewed_by uuid references public."Accounts"(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists published_word_id uuid references public."Words"(id);

create index if not exists word_contributions_status_created_at_idx
  on public."WordContributions" (status, created_at desc);

drop policy if exists "Admins can moderate contributions" on public."WordContributions";

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

  perform pg_advisory_xact_lock(hashtextextended(lower(trim(contribution.word)), 0));
  select id into published_id from public."Words"
  where lower(trim(word_st)) = lower(trim(contribution.word))
  order by id limit 1;
  if published_id is null then
    insert into public."Words" (word_st, meaning, pos)
    values (trim(contribution.word), trim(contribution.definition), nullif(trim(contribution.part_of_speech), ''))
    returning id into published_id;
  end if;

  update public."WordContributions"
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), published_word_id = published_id
  where id = contribution_id;
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

revoke all on function public.approve_contribution(uuid) from public;
revoke all on function public.reject_contribution(uuid, text) from public;
grant execute on function public.approve_contribution(uuid) to authenticated;
grant execute on function public.reject_contribution(uuid, text) to authenticated;
