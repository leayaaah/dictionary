import type { Word } from '@dictionary/shared';

export function getAllWords(): Promise<Word[]>;
export function getRandomWord(): Promise<Word | null>;
