import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { addFavorite, addSearchHistory, getFavoriteIds, removeFavorite } from '../services/profileService';
import { getWordsPage } from '../services/wordService';
import type { AuthUser, DictionaryWord } from '../types';
import { COLORS, styles } from '../theme';
import SearchBox from './SearchBox';
import WordCard from './WordCard';
import WordOfDay from './WordOfDay';

interface HomeScreenProps {
  user: AuthUser | null;
  onLogin: () => void;
}

export default function HomeScreen({ user, onLogin }: HomeScreenProps) {
  const [keyword, setKeyword] = useState('');
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [favoriteState, setFavoriteState] = useState<{ userId: string; ids: Set<number> } | null>(null);
  const favorites = user && favoriteState?.userId === user.id ? favoriteState.ids : new Set<number>();

  useEffect(() => {
    let active = true;
    getWordsPage({ page, pageSize: 5, searchKeyword: keyword })
      .then((result) => {
        if (active) {
          setWords(result.words);
          setTotalPages(result.totalPages);
        }
      })
      .catch(() => {
        if (active) Alert.alert('Không thể tải dữ liệu', 'Vui lòng kiểm tra kết nối và thử lại.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, keyword]);

  useEffect(() => {
    let active = true;
    if (!user || !words.length) return () => { active = false; };
    getFavoriteIds(words.map((item) => item.id))
      .then((ids) => { if (active) setFavoriteState({ userId: user.id, ids }); })
      .catch(() => {});
    return () => { active = false; };
  }, [user, words]);

  const search = (value: string) => {
    setLoading(true);
    setKeyword(value);
    setPage(1);
    if (user) addSearchHistory(value).catch(() => {});
  };

  const toggleFavorite = async (id: number) => {
    if (!user) {
      onLogin();
      return;
    }
    try {
      if (favorites.has(id)) {
        await removeFavorite(id);
        setFavoriteState((current) => {
          const ids = current?.userId === user.id ? new Set(current.ids) : new Set<number>();
          ids.delete(id);
          return { userId: user.id, ids };
        });
      } else {
        await addFavorite(id);
        setFavoriteState((current) => {
          const ids = current?.userId === user.id ? new Set(current.ids) : new Set<number>();
          ids.add(id);
          return { userId: user.id, ids };
        });
      }
    } catch (error) {
      Alert.alert('Không thể cập nhật', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };

  const clearSearch = () => {
    setLoading(true);
    setKeyword('');
    setPage(1);
  };

  return (
    <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>KHÁM PHÁ NGÔN NGỮ</Text>
        <Text style={styles.heroTitle}>Tìm đúng từ,{ '\n' }hiểu sâu hơn.</Text>
        <Text style={styles.heroSubtitle}>Tra cứu từ điển S&apos;tiêng mọi lúc, ngay trên điện thoại.</Text>
        <SearchBox onSearch={search} onClear={clearSearch} />
      </View>
      {!keyword ? <WordOfDay /> : null}
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>{keyword ? `Kết quả cho “${keyword}”` : 'Từ vựng mới nhất'}</Text>
        {totalPages > 1 ? <Text style={styles.pageLabel}>{page}/{totalPages}</Text> : null}
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} /> : words.length ? (
        <FlatList
          data={words}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <WordCard item={item} signedIn={Boolean(user)} favorite={favorites.has(item.id)} onFavorite={toggleFavorite} />}
        />
      ) : <Text style={styles.emptyText}>{keyword ? 'Không tìm thấy từ phù hợp.' : 'Chưa có từ vựng nào.'}</Text>}
      {totalPages > 1 ? (
        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => { setLoading(true); setPage((value) => value - 1); }}><Text style={[styles.pageButton, page === 1 && styles.disabled]}>‹ Trước</Text></Pressable>
          <Pressable disabled={page === totalPages} onPress={() => { setLoading(true); setPage((value) => value + 1); }}><Text style={[styles.pageButton, page === totalPages && styles.disabled]}>Sau ›</Text></Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
