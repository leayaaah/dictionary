export async function signIn(client, username, password) {
  const { data, error } = await client
    .from('Accounts')
    // Never return the password to the browser or persist it in localStorage.
    .select('id, username')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const login = signIn;
