import type { AuthChangeEvent, AuthResponse, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Account } from './index.js';

export function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<Account>;

export const login: typeof signIn;

export function signUp(
  client: SupabaseClient,
  details: { fullName: string; email: string; password: string },
): Promise<AuthResponse['data']>;

export function getSession(client: SupabaseClient): Promise<Session | null>;
export function signOut(client: SupabaseClient): Promise<void>;
export function onAuthStateChange(
  client: SupabaseClient,
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): ReturnType<SupabaseClient['auth']['onAuthStateChange']>['data']['subscription'];
