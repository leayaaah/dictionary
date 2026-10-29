import {
  addFavorite as addFavoriteWithClient,
  addSearchHistory as addSearchHistoryWithClient,
  createContribution as createContributionWithClient,
  deleteContribution as deleteContributionWithClient,
  deleteSearchHistoryItem as deleteSearchHistoryItemWithClient,
  getAccount as getAccountWithClient,
  getContributions as getContributionsWithClient,
  getContributionStatusLabel,
  validateContribution,
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
export async function uploadProfileAvatar(asset, userId) {
  const mimeType = asset.mimeType;
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const fileToken = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const path = `${userId}/${fileToken}.${extension}`;
  const response = await fetch(asset.uri);
  const fileData = await response.arrayBuffer();
  if (fileData.byteLength > 5 * 1024 * 1024) throw new Error('Ảnh đại diện không được vượt quá 5 MB.');

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, fileData, {
    cacheControl: '3600',
    contentType: mimeType,
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
export const getFavoriteIds = (ids) => getFavoriteIdsWithClient(supabase, ids);
export const addFavorite = (id) => addFavoriteWithClient(supabase, id);
export const removeFavorite = (id) => removeFavoriteWithClient(supabase, id);
export const addSearchHistory = (query) => addSearchHistoryWithClient(supabase, query);
export const getSearchHistory = () => getSearchHistoryWithClient(supabase);
export const deleteSearchHistoryItem = (id) => deleteSearchHistoryItemWithClient(supabase, id);
export const getContributions = () => getContributionsWithClient(supabase);
export const createContribution = (contribution) => createContributionWithClient(supabase, contribution);
export const deleteContribution = (id) => deleteContributionWithClient(supabase, id);
export { getContributionStatusLabel, validateContribution };
