import type { SupabaseClient } from '@supabase/supabase-js';

export interface Contribution {
  id: string;
  account_id: string;
  word_st: string;
  word_vi: string | null;
  pos: string | null;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_word_id: string | null;
  created_at: string;
  updated_at: string;
}

export function getAccount(client: SupabaseClient): Promise<Record<string, unknown>>;
export function updateAccount(client: SupabaseClient, updates: { full_name?: string; avatar_url?: string }): Promise<Record<string, unknown>>;
export function getFavorites(client: SupabaseClient): Promise<Array<Record<string, unknown>>>;
export function getFavoriteIds(client: SupabaseClient, wordIds: string[]): Promise<Set<string>>;
export function addFavorite(client: SupabaseClient, wordId: string): Promise<Record<string, unknown>>;
export function removeFavorite(client: SupabaseClient, wordId: string): Promise<void>;
export function addSearchHistory(client: SupabaseClient, searchQuery: string): Promise<Record<string, unknown> | null>;
export function getSearchHistory(client: SupabaseClient): Promise<Array<Record<string, unknown>>>;
export function deleteSearchHistoryItem(client: SupabaseClient, id: string | number): Promise<void>;
export function getContributions(client: SupabaseClient): Promise<Contribution[]>;
export function createContribution(client: SupabaseClient, contribution: { word_st: string; word_vi: string; pos?: string; meaning: string; phonetic?: string; example?: string }): Promise<Contribution>;
export function updateContribution(client: SupabaseClient, id: string, contribution: { word_st: string; word_vi: string; pos?: string; meaning: string; phonetic?: string; example?: string }): Promise<Contribution>;
export const CONTRIBUTION_FIELD_LIMITS: { word_st: number; word_vi: number; pos: number; meaning: number; phonetic: number; example: number };
export function getContributionStatusLabel(status?: string): string;
export function validateContribution(values: { word_st: string; word_vi: string; pos?: string; meaning: string; phonetic?: string; example?: string }): { normalized: { word_st: string; word_vi: string; pos: string; meaning: string; phonetic: string; example: string }; errors: Record<string, string> };
export function getAdminContributions(client: SupabaseClient, options?: { status?: 'pending' | 'approved' | 'rejected' | 'all'; search?: string; page?: number; pageSize?: number }): Promise<{ contributions: Array<Contribution & { Accounts?: { full_name?: string | null } | null }>; total: number }>;
export function moderateContribution(client: SupabaseClient, action: 'approve' | 'reject', id: string, note?: string): Promise<string | null>;
export function deleteContribution(client: SupabaseClient, id: string | number): Promise<void>;
