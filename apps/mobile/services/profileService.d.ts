interface AccountRecord {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

import type { Word } from '@dictionary/shared';

interface FavoriteRecord {
  id: string | number;
  word_id?: string;
  Words?: Word;
}

interface HistoryRecord {
  id: string | number;
  search_query: string;
}

interface ContributionRecord {
  id: string;
  word_st: string;
  word?: string;
  word_vi: string;
  meaning: string;
  definition?: string;
  pos: string | null;
  part_of_speech?: string | null;
  phonetic: string | null;
  example?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  published_word_id?: string | null;
}

export function getAccount(): Promise<AccountRecord>;
export function updateAccount(updates: { full_name?: string; avatar_url?: string }): Promise<AccountRecord>;
export function uploadProfileAvatar(asset: { uri: string; mimeType?: string | null }, userId: string): Promise<{ path: string; publicUrl: string }>;
export function removeProfileAvatarByUrl(url: string, userId: string): Promise<void>;
export function getFavorites(): Promise<FavoriteRecord[]>;
export function getFavoriteIds(wordIds: string[]): Promise<Set<string>>;
export function addFavorite(wordId: string): Promise<FavoriteRecord>;
export function removeFavorite(wordId: string): Promise<void>;
export function addSearchHistory(searchQuery: string): Promise<HistoryRecord | null>;
export function getSearchHistory(): Promise<HistoryRecord[]>;
export function deleteSearchHistoryItem(id: string | number): Promise<void>;
export function getContributions(): Promise<ContributionRecord[]>;
export function createContribution(contribution: {
  word_st: string;
  word_vi: string;
  meaning: string;
  pos?: string;
  phonetic?: string;
  example?: string;
}): Promise<ContributionRecord>;
export function updateContribution(id: string, contribution: {
  word_st: string;
  word_vi: string;
  meaning: string;
  pos?: string;
  phonetic?: string;
  example?: string;
}): Promise<ContributionRecord>;
export function deleteContribution(id: string | number): Promise<void>;
export function getContributionStatusLabel(status?: string): string;
export function validateContribution(values: { word_st: string; word_vi: string; pos?: string; meaning: string; phonetic?: string; example?: string }): { normalized: { word_st: string; word_vi: string; pos: string; meaning: string; phonetic: string; example: string }; errors: Record<string, string> };
