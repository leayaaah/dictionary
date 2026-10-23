import { createDictionaryClient } from '@dictionary/shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createDictionaryClient(supabaseUrl, supabaseAnonKey);
