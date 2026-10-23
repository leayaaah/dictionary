import { supabase } from '../lib/supabaseClient';

const WORDS_TABLE = 'Words';

export async function getWordsPage({ page, pageSize, searchKeyword = '' }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from(WORDS_TABLE)
    .select('*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(from, to);

  if (searchKeyword) {
    query = query.or(`word_st.ilike.%${searchKeyword}%,word_vi.ilike.%${searchKeyword}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { words: data || [], totalPages: Math.ceil((count || 0) / pageSize) };
}

export async function getRandomWord() {
  const { count, error: countError } = await supabase
    .from(WORDS_TABLE)
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;
  if (!count) return null;

  const randomIndex = Math.floor(Math.random() * count);
  const { data, error } = await supabase
    .from(WORDS_TABLE)
    .select('*')
    .range(randomIndex, randomIndex)
    .single();

  if (error) throw error;
  return data;
}
