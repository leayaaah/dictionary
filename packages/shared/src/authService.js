export async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data.user;
}

export const login = signIn;
