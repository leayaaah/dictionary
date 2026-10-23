import { Pressable, Text, View } from 'react-native';
import type { DictionaryWord } from '../types';
import { styles } from '../theme';

interface WordCardProps {
  item: DictionaryWord;
  favorite: boolean;
  onFavorite: (id: number) => void;
  signedIn: boolean;
}

export default function WordCard({ item, favorite, onFavorite, signedIn }: WordCardProps) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.wordCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.wordTitle}>{item.word_st}</Text>
          <Text style={styles.wordPos}>{item.pos || 'Từ vựng'}</Text>
        </View>
        {signedIn ? <Pressable onPress={() => onFavorite(item.id)} accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}><Text style={favorite ? styles.favoriteActive : styles.favorite}>★</Text></Pressable> : null}
      </View>
      <Text style={styles.translation}>{item.word_vi}</Text>
      {item.meaning ? <Text style={styles.definition}>{item.meaning}</Text> : null}
      {item.example ? <Text style={styles.example}>“{item.example}”</Text> : null}
    </View>
  );
}
