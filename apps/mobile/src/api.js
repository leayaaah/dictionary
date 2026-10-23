import { createDictionaryClient } from '@dictionary/shared';
import {
  getSession as getSessionWithClient,
  onAuthStateChange as onAuthStateChangeWithClient,
  signIn as signInWithClient,
  signOut as signOutWithClient,
  signUp as signUpWithClient,
} from '@dictionary/shared/authService';
import {
  addFavorite as addFavoriteWithClient,
  addSearchHistory as addSearchHistoryWithClient,
  createContribution as createContributionWithClient,
  deleteContribution as deleteContributionWithClient,
  deleteSearchHistoryItem as deleteSearchHistoryItemWithClient,
  getAccount as getAccountWithClient,
  getContributions as getContributionsWithClient,
  getFavoriteIds as getFavoriteIdsWithClient,
  getFavorites as getFavoritesWithClient,
  getSearchHistory as getSearchHistoryWithClient,
  removeFavorite as removeFavoriteWithClient,
  updateAccount as updateAccountWithClient,
} from '@dictionary/shared/profileService';
import {
  getRandomWord as getRandomWordWithClient,
  getWordsPage as getWordsPageWithClient,
} from '@dictionary/shared/wordService';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isConfigured
  ? createDictionaryClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

function clientRequired() {
  if (!supabase) {
    throw new Error('Thiếu cấu hình Supabase. Hãy tạo apps/mobile/.env từ .env.example.');
  }
  return supabase;
}

export const getSession = () => getSessionWithClient(clientRequired());
export const onAuthStateChange = (callback) => onAuthStateChangeWithClient(clientRequired(), callback);
export const signIn = (email, password) => signInWithClient(clientRequired(), email, password);
export const signOut = () => signOutWithClient(clientRequired());
export const signUp = (details) => signUpWithClient(clientRequired(), details);
export const getWordsPage = (options) => getWordsPageWithClient(clientRequired(), options);
export const getRandomWord = () => getRandomWordWithClient(clientRequired());
export const getAccount = () => getAccountWithClient(clientRequired());
export const updateAccount = (updates) => updateAccountWithClient(clientRequired(), updates);
export const getFavorites = () => getFavoritesWithClient(clientRequired());
export const getFavoriteIds = (ids) => getFavoriteIdsWithClient(clientRequired(), ids);
export const addFavorite = (id) => addFavoriteWithClient(clientRequired(), id);
export const removeFavorite = (id) => removeFavoriteWithClient(clientRequired(), id);
export const addSearchHistory = (query) => addSearchHistoryWithClient(clientRequired(), query);
export const getSearchHistory = () => getSearchHistoryWithClient(clientRequired());
export const deleteSearchHistoryItem = (id) => deleteSearchHistoryItemWithClient(clientRequired(), id);
export const getContributions = () => getContributionsWithClient(clientRequired());
export const createContribution = (contribution) => createContributionWithClient(clientRequired(), contribution);
export const deleteContribution = (id) => deleteContributionWithClient(clientRequired(), id);
