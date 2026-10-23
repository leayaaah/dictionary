import { signIn as signInWithClient } from '@dictionary/shared/authService';
import { supabase } from '../lib/supabaseClient';

export const signIn = (username, password) => signInWithClient(supabase, username, password);
export const login = signIn;

export async function signUp({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) throw error;
  return data;
}
