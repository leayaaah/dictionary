export async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data.user;
}

export const login = signIn;

export async function signUp(client, { fullName, email, password }) {
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
    },
  });

  if (error) throw error;
  return data;
}
