import { getRandomWord as getRandomWordWithClient, getWordsPage as getWordsPageWithClient } from '@dictionary/shared/wordService';
import { supabase } from '../lib/supabaseClient';

export const getWordsPage = (options) => getWordsPageWithClient(supabase, options);
export const getRandomWord = () => getRandomWordWithClient(supabase);
