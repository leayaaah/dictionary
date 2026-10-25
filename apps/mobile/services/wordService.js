import { getAllWords as getAllWordsWithClient, getRandomWord as getRandomWordWithClient } from '@dictionary/shared/wordService';
import { supabase } from '../lib/supabaseClient';

export const getAllWords = () => getAllWordsWithClient(supabase);
export const getRandomWord = () => getRandomWordWithClient(supabase);
