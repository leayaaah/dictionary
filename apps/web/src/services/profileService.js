import {
  addFavorite as addFavoriteWithClient,
  addSearchHistory as addSearchHistoryWithClient,
  createContribution as createContributionWithClient,
  deleteContribution as deleteContributionWithClient,
  deleteSearchHistoryItem as deleteSearchHistoryItemWithClient,
  getAccount as getAccountWithClient,
  getContributions as getContributionsWithClient,
  getAdminContributions as getAdminContributionsWithClient,
  moderateContribution as moderateContributionWithClient,
  getFavoriteIds as getFavoriteIdsWithClient,
  getFavorites as getFavoritesWithClient,
  getSearchHistory as getSearchHistoryWithClient,
  removeFavorite as removeFavoriteWithClient,
  updateAccount as updateAccountWithClient,
} from '@dictionary/shared/profileService';
import { supabase } from '../lib/supabaseClient';

const AVATAR_BUCKET = 'profile-avatars';

export const getAccount = () => getAccountWithClient(supabase);
export const updateAccount = (updates) => updateAccountWithClient(supabase, updates);
export async function uploadProfileAvatar(file, userId) {
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function removeProfileAvatarByUrl(url, userId) {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const pathIndex = url.indexOf(marker);
  if (pathIndex < 0) return;
  const path = decodeURIComponent(url.slice(pathIndex + marker.length));
  if (!path || path.split('/')[0] !== userId) return;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) throw error;
}

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
export const getAdminContributions = (options) => getAdminContributionsWithClient(supabase, options);
export const moderateContribution = (action, id, note) => moderateContributionWithClient(supabase, action, id, note);
