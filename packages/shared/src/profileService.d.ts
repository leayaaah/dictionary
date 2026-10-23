import type { SupabaseClient } from '@supabase/supabase-js';

export function getAccount(client: SupabaseClient): Promise<Record<string, unknown>>;
export function updateAccount(client: SupabaseClient, updates: { full_name?: string; avatar_url?: string }): Promise<Record<string, unknown>>;
export function getFavorites(client: SupabaseClient): Promise<Array<Record<string, unknown>>>;
export function getFavoriteIds(client: SupabaseClient, wordIds: number[]): Promise<Set<number>>;
export function addFavorite(client: SupabaseClient, wordId: string): Promise<Record<string, unknown>>;
export function removeFavorite(client: SupabaseClient, wordId: string): Promise<void>;
export function addSearchHistory(client: SupabaseClient, searchQuery: string): Promise<Record<string, unknown> | null>;
export function getSearchHistory(client: SupabaseClient): Promise<Array<Record<string, unknown>>>;
export function deleteSearchHistoryItem(client: SupabaseClient, id: string | number): Promise<void>;
export function getContributions(client: SupabaseClient): Promise<Array<Record<string, unknown>>>;
export function createContribution(client: SupabaseClient, contribution: { word: string; definition: string; part_of_speech?: string; phonetic?: string }): Promise<Record<string, unknown>>;
export function deleteContribution(client: SupabaseClient, id: string | number): Promise<void>;
