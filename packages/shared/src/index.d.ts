import type { SupabaseClient } from '@supabase/supabase-js';

export interface Word {
  id: number;
  word_st: string;
  word_vi: string;
  pos?: string | null;
  meaning?: string | null;
  example?: string | null;
}

export type Account = import('@supabase/supabase-js').User;

export function createDictionaryClient(url: string, anonKey: string, options?: Record<string, unknown>): SupabaseClient;
export function getWordsPage(
  client: SupabaseClient,
  options: { page: number; pageSize: number; searchKeyword?: string },
): Promise<{ words: Word[]; totalPages: number }>;
export function getRandomWord(client: SupabaseClient): Promise<Word | null>;
export function signIn(client: SupabaseClient, email: string, password: string): Promise<Account>;
export function login(client: SupabaseClient, email: string, password: string): Promise<Account>;
export function signUp(
  client: SupabaseClient,
  details: { fullName: string; email: string; password: string },
): Promise<import('@supabase/supabase-js').AuthResponse['data']>;
export function getSession(client: SupabaseClient): Promise<import('@supabase/supabase-js').Session | null>;
export function signOut(client: SupabaseClient): Promise<void>;
export function onAuthStateChange(
  client: SupabaseClient,
  callback: (event: import('@supabase/supabase-js').AuthChangeEvent, session: import('@supabase/supabase-js').Session | null) => void,
): ReturnType<SupabaseClient['auth']['onAuthStateChange']>['data']['subscription'];
