import type { SupabaseClient } from '@supabase/supabase-js';
import type { Account } from './index.js';

export function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<Account>;

export const login: typeof signIn;
