import type { SupabaseClient } from '@supabase/supabase-js';
import type { Account } from './index.js';

export function login(
  client: SupabaseClient,
  username: string,
  password: string,
): Promise<Account | null>;
