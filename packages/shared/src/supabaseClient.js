import { createClient } from '@supabase/supabase-js';

export function createDictionaryClient(url, anonKey, options = {}) {
  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon key are required.');
  }

  return createClient(url, anonKey, options);
}
