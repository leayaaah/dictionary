import { getRandomWord as getRandomWordFromClient, getWordsPage as getWordsPageFromClient } from '@dictionary/shared/wordService';
import { supabase } from '../lib/supabaseClient';

export const getWordsPage = (options) => getWordsPageFromClient(supabase, options);
export const getRandomWord = () => getRandomWordFromClient(supabase);
