import type { SupabaseClient } from '@supabase/supabase-js';
import type { Word } from './index.js';

export function getWordsPage(
  client: SupabaseClient,
  options: { page: number; pageSize: number; searchKeyword?: string },
): Promise<{ words: Word[]; totalPages: number }>;
export function getRandomWord(client: SupabaseClient): Promise<Word | null>;
