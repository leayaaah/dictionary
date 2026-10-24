const ACCOUNTS_TABLE = 'Accounts';
const FAVORITES_TABLE = 'UserFavorites';
const HISTORY_TABLE = 'SearchHistory';
const CONTRIBUTIONS_TABLE = 'WordContributions';
const WORDS_TABLE = 'Words';

async function requireUser(client) {
  if (!client?.auth?.getUser) {
    throw new Error('Không thể kiểm tra phiên đăng nhập.');
  }

  const { data, error } = await client.auth.getUser();
  if (error) throw error;

  const user = data?.user;
  if (!user?.id) {
    throw new Error('Bạn cần đăng nhập để sử dụng chức năng này.');
  }

  return user;
}

export async function getAccount(client) {
  const user = await requireUser(client);
  const { data, error } = await client.from(ACCOUNTS_TABLE).select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data || { id: user.id, full_name: user.user_metadata?.full_name || '', avatar_url: null };
}

export async function updateAccount(client, updates) {
  const user = await requireUser(client);
  const { data, error } = await client
    .from(ACCOUNTS_TABLE)
    .upsert({ id: user.id, full_name: updates.full_name?.trim() || null, avatar_url: updates.avatar_url?.trim() || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFavorites(client) {
  const user = await requireUser(client);
  const { data, error } = await client
    .from(FAVORITES_TABLE)
    .select('id, created_at, word_id, Words(*)')
    .eq('account_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getFavoriteIds(client, wordIds) {
  if (!wordIds.length) return new Set();
  const user = await requireUser(client);
  const { data, error } = await client.from(FAVORITES_TABLE).select('word_id').eq('account_id', user.id).in('word_id', wordIds);
  if (error) throw error;
  return new Set((data || []).map((item) => item.word_id));
}

export async function addFavorite(client, wordId) {
  const user = await requireUser(client);
  const { data, error } = await client.from(FAVORITES_TABLE).insert({ account_id: user.id, word_id: wordId }).select().single();
  if (error) throw error;
  return data;
}

export async function removeFavorite(client, wordId) {
  const user = await requireUser(client);
  const { error } = await client.from(FAVORITES_TABLE).delete().eq('account_id', user.id).eq('word_id', wordId);
  if (error) throw error;
}

export async function addSearchHistory(client, searchQuery) {
  const user = await requireUser(client);
  const query = searchQuery.trim();
  if (!query) return null;
  const { data, error } = await client.from(HISTORY_TABLE).insert({ account_id: user.id, search_query: query }).select().single();
  if (error) throw error;
  return data;
}

export async function getSearchHistory(client) {
  const user = await requireUser(client);
  const { data, error } = await client.from(HISTORY_TABLE).select('*').eq('account_id', user.id).order('searched_at', { ascending: false }).limit(30);
  if (error) throw error;
  return data || [];
}

export async function deleteSearchHistoryItem(client, id) {
  const user = await requireUser(client);
  const { error } = await client.from(HISTORY_TABLE).delete().eq('account_id', user.id).eq('id', id);
  if (error) throw error;
}

export async function getContributions(client) {
  const user = await requireUser(client);
  const { data, error } = await client.from(CONTRIBUTIONS_TABLE).select('*').eq('account_id', user.id).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createContribution(client, contribution) {
  const user = await requireUser(client);
  const { data, error } = await client
    .from(CONTRIBUTIONS_TABLE)
    .insert({ ...contribution, account_id: user.id, word: contribution.word.trim(), definition: contribution.definition.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContribution(client, id) {
  const user = await requireUser(client);
  const { error } = await client.from(CONTRIBUTIONS_TABLE).delete().eq('account_id', user.id).eq('id', id);
  if (error) throw error;
}

export { WORDS_TABLE };
