import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { getFavorites, removeFavorite } from '../services/profileService';
import type { FavoriteRecord } from '../types';
import { COLORS, styles } from '../theme';
import WordCard from './WordCard';

interface NotebookScreenProps { userId: string }

export default function NotebookScreen({ userId }: NotebookScreenProps) {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getFavorites()
      .then((items) => { if (active) setFavorites(items as FavoriteRecord[]); })
      .catch(() => { if (active) Alert.alert('Không thể tải sổ tay', 'Vui lòng kiểm tra kết nối và thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const deleteFavorite = async (wordId: number) => {
    try {
      await removeFavorite(wordId);
      setFavorites((items) => items.filter((item) => item.word_id !== wordId));
    } catch {
      Alert.alert('Không thể bỏ lưu từ', 'Vui lòng thử lại.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.sectionKicker}>GÓC HỌC TẬP</Text>
      <Text style={styles.profileTitle}>Sổ tay từ vựng</Text>
      <Text style={styles.pageIntro}>Những từ bạn yêu thích, sẵn sàng để ôn tập bất cứ lúc nào.</Text>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} /> : favorites.length ? favorites.map((favorite) => (
        favorite.Words ? <WordCard key={favorite.id} item={favorite.Words} signedIn favorite containerStyle={{ marginHorizontal: 0 }} onFavorite={() => deleteFavorite(favorite.word_id ?? favorite.Words!.id)} /> : null
      )) : <View style={styles.emptyCard}><Text style={styles.emptyCardIcon}>☆</Text><Text style={styles.emptyCardTitle}>Sổ tay đang trống</Text><Text style={styles.emptyCardText}>Chạm vào biểu tượng ngôi sao ở một từ để lưu lại tại đây.</Text></View>}
    </ScrollView>
  );
}
