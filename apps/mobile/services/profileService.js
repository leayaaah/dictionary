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
export const getFavoriteIds = (ids) => getFavoriteIdsWithClient(supabase, ids);
export const addFavorite = (id) => addFavoriteWithClient(supabase, id);
export const removeFavorite = (id) => removeFavoriteWithClient(supabase, id);
export const addSearchHistory = (query) => addSearchHistoryWithClient(supabase, query);
export const getSearchHistory = () => getSearchHistoryWithClient(supabase);
export const deleteSearchHistoryItem = (id) => deleteSearchHistoryItemWithClient(supabase, id);
export const getContributions = () => getContributionsWithClient(supabase);
export const createContribution = (contribution) => createContributionWithClient(supabase, contribution);
export const deleteContribution = (id) => deleteContributionWithClient(supabase, id);
