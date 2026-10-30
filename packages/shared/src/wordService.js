const WORDS_TABLE = 'Words';

export async function getAllWords(client) {
  const pageSize = 1000;
  const words = [];
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const { data, error } = await client
      .from(WORDS_TABLE)
      .select('*')
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    words.push(...(data || []));
    if (!data || data.length < pageSize) return words;
    page += 1;
  }
}

export async function getWordsPage(client, { page, pageSize, searchKeyword = '' }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = client
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
