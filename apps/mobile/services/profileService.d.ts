interface AccountRecord {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface FavoriteRecord {
  id: string | number;
  word_id?: number;
  Words?: Record<string, unknown>;
}

interface HistoryRecord {
  id: string | number;
  search_query: string;
}

interface ContributionRecord {
  id: string | number;
  word: string;
  definition: string;
  part_of_speech?: string;
  phonetic?: string;
  status?: string;
}

export function getAccount(): Promise<AccountRecord>;
export function updateAccount(updates: { full_name?: string; avatar_url?: string }): Promise<AccountRecord>;
export function getFavorites(): Promise<FavoriteRecord[]>;
export function getFavoriteIds(wordIds: number[]): Promise<Set<number>>;
export function addFavorite(wordId: number): Promise<FavoriteRecord>;
export function removeFavorite(wordId: number): Promise<void>;
export function addSearchHistory(searchQuery: string): Promise<HistoryRecord | null>;
export function getSearchHistory(): Promise<HistoryRecord[]>;
export function deleteSearchHistoryItem(id: string | number): Promise<void>;
export function getContributions(): Promise<ContributionRecord[]>;
export function createContribution(contribution: {
  word: string;
  definition: string;
  part_of_speech?: string;
  phonetic?: string;
}): Promise<ContributionRecord>;
export function deleteContribution(id: string | number): Promise<void>;
