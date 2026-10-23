import type { SupabaseClient } from '@supabase/supabase-js';
import type { Account } from './index.js';

export function signIn(
  client: SupabaseClient,
  username: string,
  password: string,
): Promise<Account | null>;

export const login: typeof signIn;
