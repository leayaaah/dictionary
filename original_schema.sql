


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."contribution_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."contribution_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_contribution"("contribution_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."approve_contribution"("contribution_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public."Accounts" (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_account"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public."Accounts" (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_contribution"("contribution_id" "uuid", "note" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
begin
  if not public.is_admin() then raise exception 'Bạn không có quyền từ chối đóng góp.' using errcode = '42501'; end if;
  if nullif(trim(note), '') is null then raise exception 'Vui lòng nhập lý do từ chối.' using errcode = '22023'; end if;

  update public."WordContributions"
  set status = 'rejected', admin_note = trim(note), reviewed_by = auth.uid(), reviewed_at = now()
  where id = contribution_id and status = 'pending';
  if not found then raise exception 'Không tìm thấy đóng góp đang chờ duyệt.' using errcode = 'P0002'; end if;
end;
$$;


ALTER FUNCTION "public"."reject_contribution"("contribution_id" "uuid", "note" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."WordContributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "word" "text" NOT NULL,
    "definition" "text" NOT NULL,
    "part_of_speech" "text",
    "phonetic" "text",
    "status" "public"."contribution_status" DEFAULT 'pending'::"public"."contribution_status" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "published_word_id" "uuid",
    "word_vi" "text",
    "example" "text",
    "word_st" "text",
    "meaning" "text",
    "pos" "text"
);


ALTER TABLE "public"."WordContributions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_contribution"("contribution_data" "jsonb") RETURNS "public"."WordContributions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."submit_contribution"("contribution_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_contribution"("contribution_id" "uuid", "contribution_data" "jsonb") RETURNS "public"."WordContributions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."update_contribution"("contribution_id" "uuid", "contribution_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_word_contributions_modtime"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_word_contributions_modtime"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Accounts" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."Accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SearchHistory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "search_query" "text" NOT NULL,
    "searched_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."SearchHistory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."UserFavorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "word_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."UserFavorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Words" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "word_vi" "text",
    "word_st" "text",
    "pos" "text",
    "meaning" "text",
    "example" "text",
    "phonetic" "text"
);


ALTER TABLE "public"."Words" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Accounts"
    ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SearchHistory"
    ADD CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserFavorites"
    ADD CONSTRAINT "UserFavorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."WordContributions"
    ADD CONSTRAINT "WordContributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Words"
    ADD CONSTRAINT "Words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserFavorites"
    ADD CONSTRAINT "unique_user_word_favorite" UNIQUE ("account_id", "word_id");



CREATE INDEX "idx_search_history_account_time" ON "public"."SearchHistory" USING "btree" ("account_id", "searched_at" DESC);



CREATE INDEX "search_history_account_searched_at_idx" ON "public"."SearchHistory" USING "btree" ("account_id", "searched_at" DESC);



CREATE INDEX "user_favorites_account_created_at_idx" ON "public"."UserFavorites" USING "btree" ("account_id", "created_at" DESC);



CREATE INDEX "word_contributions_account_created_at_idx" ON "public"."WordContributions" USING "btree" ("account_id", "created_at" DESC);



CREATE INDEX "word_contributions_status_created_at_idx" ON "public"."WordContributions" USING "btree" ("status", "created_at" DESC);



CREATE OR REPLACE TRIGGER "update_word_contributions_modtime" BEFORE UPDATE ON "public"."WordContributions" FOR EACH ROW EXECUTE FUNCTION "public"."update_word_contributions_modtime"();



ALTER TABLE ONLY "public"."Accounts"
    ADD CONSTRAINT "Accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."SearchHistory"
    ADD CONSTRAINT "SearchHistory_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."UserFavorites"
    ADD CONSTRAINT "UserFavorites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."UserFavorites"
    ADD CONSTRAINT "UserFavorites_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "public"."Words"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."WordContributions"
    ADD CONSTRAINT "WordContributions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."WordContributions"
    ADD CONSTRAINT "WordContributions_published_word_id_fkey" FOREIGN KEY ("published_word_id") REFERENCES "public"."Words"("id");



ALTER TABLE ONLY "public"."WordContributions"
    ADD CONSTRAINT "WordContributions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."Accounts"("id");



ALTER TABLE "public"."Accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Anyone can view approved contributions or own" ON "public"."WordContributions" FOR SELECT USING ((("status" = 'approved'::"public"."contribution_status") OR ("auth"."uid"() = "account_id") OR "public"."is_admin"()));



CREATE POLICY "Cho phep tat ca moi nguoi xem tu vuc" ON "public"."Words" FOR SELECT USING (true);



CREATE POLICY "Cho phép user tạo tài khoản của chính mình" ON "public"."Accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Cho phép xem thông tin tài khoản công khai" ON "public"."Accounts" FOR SELECT USING (true);



CREATE POLICY "Chỉ user được cập nhật tài khoản của chính mìn" ON "public"."Accounts" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."SearchHistory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."UserFavorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can delete own favorites" ON "public"."UserFavorites" FOR DELETE USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can delete own pending contributions" ON "public"."WordContributions" FOR DELETE USING ((("auth"."uid"() = "account_id") AND ("status" = 'pending'::"public"."contribution_status")));



CREATE POLICY "Users can delete own search history" ON "public"."SearchHistory" FOR DELETE USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can insert own favorites" ON "public"."UserFavorites" FOR INSERT WITH CHECK (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can insert own search history" ON "public"."SearchHistory" FOR INSERT WITH CHECK (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can view own favorites" ON "public"."UserFavorites" FOR SELECT USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can view own search history" ON "public"."SearchHistory" FOR SELECT USING (("auth"."uid"() = "account_id"));



ALTER TABLE "public"."WordContributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Words" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."approve_contribution"("contribution_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_contribution"("contribution_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_contribution"("contribution_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_contribution"("contribution_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_contribution"("contribution_id" "uuid", "note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_contribution"("contribution_id" "uuid", "note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_contribution"("contribution_id" "uuid", "note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_contribution"("contribution_id" "uuid", "note" "text") TO "service_role";



GRANT ALL ON TABLE "public"."WordContributions" TO "anon";
GRANT ALL ON TABLE "public"."WordContributions" TO "authenticated";
GRANT ALL ON TABLE "public"."WordContributions" TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_contribution"("contribution_data" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_contribution"("contribution_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_contribution"("contribution_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_contribution"("contribution_data" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_contribution"("contribution_id" "uuid", "contribution_data" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_contribution"("contribution_id" "uuid", "contribution_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_contribution"("contribution_id" "uuid", "contribution_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contribution"("contribution_id" "uuid", "contribution_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_word_contributions_modtime"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_word_contributions_modtime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_word_contributions_modtime"() TO "service_role";


















GRANT ALL ON TABLE "public"."Accounts" TO "anon";
GRANT ALL ON TABLE "public"."Accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."Accounts" TO "service_role";



GRANT ALL ON TABLE "public"."SearchHistory" TO "anon";
GRANT ALL ON TABLE "public"."SearchHistory" TO "authenticated";
GRANT ALL ON TABLE "public"."SearchHistory" TO "service_role";



GRANT ALL ON TABLE "public"."UserFavorites" TO "anon";
GRANT ALL ON TABLE "public"."UserFavorites" TO "authenticated";
GRANT ALL ON TABLE "public"."UserFavorites" TO "service_role";



GRANT ALL ON TABLE "public"."Words" TO "anon";
GRANT ALL ON TABLE "public"."Words" TO "authenticated";
GRANT ALL ON TABLE "public"."Words" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































