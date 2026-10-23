import {
  getSession as getSessionWithClient,
  onAuthStateChange as onAuthStateChangeWithClient,
  signIn as signInWithClient,
  signOut as signOutWithClient,
  signUp as signUpWithClient,
} from '@dictionary/shared/authService';
import { supabase } from '../lib/supabaseClient';

export const signIn = (email, password) => signInWithClient(supabase, email, password);
export const signUp = (details) => signUpWithClient(supabase, details);
export const getSession = () => getSessionWithClient(supabase);
export const signOut = () => signOutWithClient(supabase);
export const onAuthStateChange = (callback) => onAuthStateChangeWithClient(supabase, callback);
