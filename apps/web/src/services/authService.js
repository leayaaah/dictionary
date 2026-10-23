import { signIn as signInWithClient, signUp as signUpWithClient } from '@dictionary/shared/authService';
import { supabase } from '../lib/supabaseClient';

export const signIn = (email, password) => signInWithClient(supabase, email, password);
export const login = signIn;

export const signUp = (details) => signUpWithClient(supabase, details);
