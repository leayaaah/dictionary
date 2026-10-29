import type { Account, Word } from '@dictionary/shared';

export type AuthUser = Account;
export type DictionaryWord = Word;

export interface FavoriteRecord {
  id: string | number;
  word_id?: string;
  Words?: DictionaryWord;
}

export interface HistoryRecord {
  id: string | number;
  search_query: string;
}

export interface Contribution {
  id: string;
  word: string;
  definition: string;
  part_of_speech: string | null;
  phonetic: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  published_word_id?: string | null;
}

export interface ProfileDetails {
  full_name: string;
  avatar_url: string;
}

export type ProfileTab = 'overview' | 'favorites' | 'history' | 'contributions';
