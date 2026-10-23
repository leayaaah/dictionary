const WORDS_TABLE = 'Words';
const SEARCHABLE_COLUMNS = ['word_st', 'word_vi', 'meaning', 'example', 'pos'];

function getSearchKeywords(searchKeyword) {
  return searchKeyword
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export async function getWordsPage(client, { page, pageSize, searchKeyword = '' }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = client
    .from(WORDS_TABLE)
    .select('*', { count: 'exact' });

  const keywords = getSearchKeywords(searchKeyword);
  for (const keyword of keywords) {
    const relatedColumns = SEARCHABLE_COLUMNS
      .map((column) => `${column}.ilike.%${keyword}%`)
      .join(',');
    query = query.or(relatedColumns);
  }

  query = query.order('id', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  return { words: data || [], totalPages: Math.ceil((count || 0) / pageSize) };
}

export async function getRandomWord(client) {
  const { count, error: countError } = await client
    .from(WORDS_TABLE)
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;
  if (!count) return null;

  const randomIndex = Math.floor(Math.random() * count);
  const { data, error } = await client
    .from(WORDS_TABLE)
    .select('*')
    .range(randomIndex, randomIndex)
    .single();

  if (error) throw error;
  return data;
}
