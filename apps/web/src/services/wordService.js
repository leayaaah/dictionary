import {
  getAllWords as getAllWordsFromClient,
  getRandomWord as getRandomWordFromClient,
} from '@dictionary/shared/wordService';
import { supabase } from '../lib/supabaseClient';

export const getAllWords = () => getAllWordsFromClient(supabase);
export const getRandomWord = () => getRandomWordFromClient(supabase);
