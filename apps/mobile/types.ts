import type { Account, Word } from '@dictionary/shared';

export type AuthUser = Account;
export type DictionaryWord = Word;

export interface FavoriteRecord {
  id: string | number;
  word_id?: number;
  Words?: DictionaryWord;
}

export interface HistoryRecord {
  id: string | number;
  search_query: string;
}

export interface Contribution {
  id: string | number;
  word: string;
  definition: string;
  part_of_speech?: string;
  phonetic?: string;
  status?: string;
}

export interface ProfileDetails {
  full_name: string;
  avatar_url: string;
}

export type ProfileTab = 'overview' | 'favorites' | 'history' | 'contributions';
