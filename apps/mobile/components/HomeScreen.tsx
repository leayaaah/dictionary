import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { addFavorite, addSearchHistory, getFavoriteIds, removeFavorite } from '../services/profileService';
import { getAllWords } from '../services/wordService';
import type { AuthUser, DictionaryWord } from '../types';
import { COLORS, styles } from '../theme';
import SearchBox from './SearchBox';
import WordCard from './WordCard';
import WordOfDay from './WordOfDay';

const ITEMS_PER_PAGE = 5;

interface HomeScreenProps {
  user: AuthUser | null;
  onLogin: () => void;
}

export default function HomeScreen({ user, onLogin }: HomeScreenProps) {
  const [keyword, setKeyword] = useState('');
  const [allWords, setAllWords] = useState<DictionaryWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [favoriteState, setFavoriteState] = useState<{ userId: string; ids: Set<string> } | null>(null);
  const favorites = user && favoriteState?.userId === user.id ? favoriteState.ids : new Set<string>();

  useEffect(() => {
    let active = true;
    getAllWords()
      .then((result) => { if (active) setAllWords(result); })
      .catch(() => {
        if (active) Alert.alert('Không thể tải dữ liệu', 'Vui lòng kiểm tra kết nối và thử lại.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const searchResult = useMemo(() => searchWords(allWords, keyword), [allWords, keyword]);
  const bestMatch = searchResult.bestMatch;
  const fuzzyWords = searchResult.fuzzyWords;
  const pageCount = Math.ceil(fuzzyWords.length / ITEMS_PER_PAGE);
  const pageWords = useMemo(
    () => fuzzyWords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [fuzzyWords, page],
  );
  const displayedWords = useMemo(
    () => (bestMatch ? [bestMatch, ...pageWords] : pageWords),
    [bestMatch, pageWords],
  );

  useEffect(() => {
    if (!user || !displayedWords.length) return undefined;
    let active = true;
    getFavoriteIds(displayedWords.map((item) => item.id))
      .then((ids) => { if (active) setFavoriteState({ userId: user.id, ids }); })
      .catch(() => {});
    return () => { active = false; };
  }, [user, displayedWords]);

  const search = useCallback((value: string) => {
    setKeyword(value);
    setPage(1);
    if (user && value) addSearchHistory(value).catch(() => {});
  }, [user]);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      onLogin();
      return;
    }
    try {
      if (favorites.has(id)) {
        await removeFavorite(id);
        setFavoriteState((current) => {
          const ids = current?.userId === user.id ? new Set(current.ids) : new Set<string>();
          ids.delete(id);
          return { userId: user.id, ids };
        });
      } else {
        await addFavorite(id);
        setFavoriteState((current) => {
          const ids = current?.userId === user.id ? new Set(current.ids) : new Set<string>();
          ids.add(id);
          return { userId: user.id, ids };
        });
      }
    } catch (error) {
      Alert.alert('Không thể cập nhật', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>KHÁM PHÁ NGÔN NGỮ</Text>
        <Text style={styles.heroTitle}>Tìm đúng từ,{ '\n' }hiểu sâu hơn.</Text>
        <Text style={styles.heroSubtitle}>Tra cứu từ điển S&apos;tiêng mọi lúc, ngay trên điện thoại.</Text>
        <SearchBox onSearch={search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTags}>
          <Text style={styles.quickLabel}>Phổ biến:</Text>
          {['Bơh (Cây)', 'Lơp (Đẹp)', 'Nha (Nhà)', 'Đak (Nước)'].map((word) => (
            <Pressable key={word} onPress={() => search(word.split(' ')[0])}>
              <Text style={styles.quickTag}>{word}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {!keyword ? <WordOfDay /> : null}
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>{keyword ? `Kết quả cho “${keyword}”` : 'Từ vựng mới nhất'}</Text>
        {keyword && pageCount > 1 ? <Text style={styles.pageLabel}>{page}/{pageCount}</Text> : null}
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} /> : (
        <>
          {keyword && bestMatch ? (
            <>
              <Text style={styles.searchGroupTitle}>
                {searchResult.bestMatchIsFuzzy ? 'Kết quả gần nhất' : 'Kết quả giống nhất'}
              </Text>
              <WordCard item={bestMatch} signedIn={Boolean(user)} favorite={favorites.has(bestMatch.id)} onFavorite={toggleFavorite} />
              {fuzzyWords.length ? <Text style={styles.searchGroupTitle}>Các kết quả gần đúng</Text> : null}
            </>
          ) : null}
          {displayedWords.length ? (
            <FlatList
              data={keyword && bestMatch ? pageWords : allWords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => <WordCard item={item} signedIn={Boolean(user)} favorite={favorites.has(item.id)} onFavorite={toggleFavorite} />}
            />
          ) : <Text style={styles.emptyText}>{keyword ? 'Không tìm thấy từ phù hợp.' : 'Chưa có từ vựng nào.'}</Text>}
          {!keyword && allWords.length > ITEMS_PER_PAGE ? (
            <View style={styles.pagination}>
              <Pressable disabled={page === 1} onPress={() => setPage((value) => value - 1)}><Text style={[styles.pageButton, page === 1 && styles.disabled]}>‹ Trước</Text></Pressable>
              <Pressable disabled={page === Math.ceil(allWords.length / ITEMS_PER_PAGE)} onPress={() => setPage((value) => value + 1)}><Text style={[styles.pageButton, page === Math.ceil(allWords.length / ITEMS_PER_PAGE) && styles.disabled]}>Sau ›</Text></Pressable>
            </View>
          ) : null}
          {keyword && pageCount > 1 ? (
            <View style={styles.pagination}>
              <Pressable disabled={page === 1} onPress={() => setPage((value) => value - 1)}><Text style={[styles.pageButton, page === 1 && styles.disabled]}>‹ Trước</Text></Pressable>
              <Pressable disabled={page === pageCount} onPress={() => setPage((value) => value + 1)}><Text style={[styles.pageButton, page === pageCount && styles.disabled]}>Sau ›</Text></Pressable>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function normalizeSearchText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, previous[rightIndex - 1], above) + 1;
      diagonal = above;
    }
  }
  return previous[right.length];
}

function searchWords(words: DictionaryWord[], keyword: string) {
  const query = normalizeSearchText(keyword);
  if (!query) return { bestMatch: null, fuzzyWords: words, bestMatchIsFuzzy: false };
  const maxDistance = Math.max(1, Math.floor(query.length * 0.35));
  const matches = words.map((word) => {
    const text = normalizeSearchText([word.word_st, word.word_vi, word.meaning].join(' '));
    const exactIndex = text.indexOf(query);
    if (exactIndex >= 0) return { word, score: exactIndex };
    const distance = Math.min(...text.split(/[\s,.;:!?()[\]{}"'/-]+/).filter(Boolean).map((part) => levenshteinDistance(query, part)), levenshteinDistance(query, text));
    return distance <= maxDistance ? { word, score: 100 + distance } : null;
  }).filter((match): match is { word: DictionaryWord; score: number } => Boolean(match))
    .sort((left, right) => left.score - right.score);
  const exactMatches = matches.filter(({ score }) => score < 100);
  const fuzzyMatches = matches.filter(({ score }) => score >= 100);
  const bestMatch = (exactMatches[0] || fuzzyMatches[0])?.word || null;
  const remaining = exactMatches.length ? [...exactMatches.slice(1), ...fuzzyMatches] : fuzzyMatches.slice(1);
  return {
    bestMatch,
    fuzzyWords: remaining.map(({ word }) => word),
    bestMatchIsFuzzy: !exactMatches.length && Boolean(bestMatch),
  };
}
