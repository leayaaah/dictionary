import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getRandomWord } from '../services/wordService';
import type { DictionaryWord } from '../types';
import { styles } from '../theme';

export default function WordOfDay() {
  const [word, setWord] = useState<DictionaryWord | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const date = new Date().toISOString().slice(0, 10);
      const cached = await AsyncStorage.getItem('wordOfTheDay');
      if (cached) {
        const saved = JSON.parse(cached) as { date: string; word: DictionaryWord };
        if (saved.date === date) {
          if (active) setWord(saved.word);
          return;
        }
      }
      const fresh = await getRandomWord();
      if (fresh) {
        if (active) setWord(fresh);
        await AsyncStorage.setItem('wordOfTheDay', JSON.stringify({ date, word: fresh }));
      }
    };
    load().catch(() => {});
    return () => { active = false; };
  }, []);

  if (!word) return null;
  return (
    <View style={styles.wordDayCard}>
      <Text style={styles.sectionKicker}>GỢI Ý HÔM NAY</Text>
      <Text style={styles.wordDayTitle}>{word.word_st}</Text>
      <Text style={styles.wordPos}>{word.pos || 'Từ vựng'}</Text>
      <Text style={styles.wordMeaning}>{word.word_vi} · {word.meaning}</Text>
      {word.example ? <Text style={styles.wordDayExample}>{word.example}</Text> : null}
    </View>
  );
}
