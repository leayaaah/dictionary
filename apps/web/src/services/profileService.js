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
import { supabase } from '../lib/supabaseClient';

export const getAccount = () => getAccountWithClient(supabase);
export const updateAccount = (updates) => updateAccountWithClient(supabase, updates);
export const getFavorites = () => getFavoritesWithClient(supabase);
export const getFavoriteIds = (wordIds) => getFavoriteIdsWithClient(supabase, wordIds);
export const addFavorite = (wordId) => addFavoriteWithClient(supabase, wordId);
export const removeFavorite = (wordId) => removeFavoriteWithClient(supabase, wordId);
export const addSearchHistory = (query) => addSearchHistoryWithClient(supabase, query);
export const getSearchHistory = () => getSearchHistoryWithClient(supabase);
export const deleteSearchHistoryItem = (id) => deleteSearchHistoryItemWithClient(supabase, id);
export const getContributions = () => getContributionsWithClient(supabase);
export const createContribution = (contribution) => createContributionWithClient(supabase, contribution);
export const deleteContribution = (id) => deleteContributionWithClient(supabase, id);
