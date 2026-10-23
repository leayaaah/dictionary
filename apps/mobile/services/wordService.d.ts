import type { Word } from '@dictionary/shared';

export function getWordsPage(options: { page: number; pageSize: number; searchKeyword?: string }): Promise<{ words: Word[]; totalPages: number }>;
export function getRandomWord(): Promise<Word | null>;
