export async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data.user;
}

export const login = signIn;

export async function getSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut(client) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(client, callback) {
  return client.auth.onAuthStateChange(callback).data.subscription;
}

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
