import { login as loginWithClient } from '@dictionary/shared/authService';
import { supabase } from '../lib/supabaseClient';

export const login = (username, password) => loginWithClient(supabase, username, password);

export async function signUp({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) throw error;
  return data;
}
