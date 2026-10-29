import type { SupabaseClient } from '@supabase/supabase-js';

export interface Contribution {
  id: string;
  account_id: string;
  word: string;
  definition: string;
  part_of_speech: string | null;
  phonetic: string | null;
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
export function createContribution(client: SupabaseClient, contribution: { word: string; definition: string; part_of_speech?: string; phonetic?: string }): Promise<Contribution>;
export const CONTRIBUTION_FIELD_LIMITS: { word: number; definition: number; part_of_speech: number; phonetic: number };
export function getContributionStatusLabel(status?: string): string;
export function validateContribution(values: { word: string; definition: string; part_of_speech?: string; phonetic?: string }): { normalized: { word: string; definition: string; part_of_speech: string; phonetic: string }; errors: Record<string, string> };
export function getAdminContributions(client: SupabaseClient, options?: { status?: 'pending' | 'approved' | 'rejected' | 'all'; search?: string; page?: number; pageSize?: number }): Promise<{ contributions: Array<Contribution & { Accounts?: { full_name?: string | null } | null }>; total: number }>;
export function moderateContribution(client: SupabaseClient, action: 'approve' | 'reject', id: string, note?: string): Promise<string | null>;
export function deleteContribution(client: SupabaseClient, id: string | number): Promise<void>;
