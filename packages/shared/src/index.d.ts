import type { SupabaseClient } from '@supabase/supabase-js';

export interface Word {
  id: number;
  word_st: string;
  word_vi: string;
  pos?: string | null;
  meaning?: string | null;
  example?: string | null;
}

export interface Account {
  id: number;
  username: string;
  [key: string]: unknown;
}

export function createDictionaryClient(url: string, anonKey: string, options?: Record<string, unknown>): SupabaseClient;
export function getWordsPage(
  client: SupabaseClient,
  options: { page: number; pageSize: number; searchKeyword?: string },
): Promise<{ words: Word[]; totalPages: number }>;
export function getRandomWord(client: SupabaseClient): Promise<Word | null>;
export function login(client: SupabaseClient, username: string, password: string): Promise<Account | null>;
