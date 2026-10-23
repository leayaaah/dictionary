import { supabase } from '../lib/supabaseClient';

export async function login(username, password) {
  const { data, error } = await supabase
    .from('Accounts')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}
