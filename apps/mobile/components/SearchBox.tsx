import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../theme';

interface SearchBoxProps {
  onSearch: (keyword: string) => void;
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');
  const lastDispatchedKeyword = useRef('');

  useEffect(() => {
    const value = keyword.trim();
    const timeoutId = setTimeout(() => {
      if (value === lastDispatchedKeyword.current) return;
      lastDispatchedKeyword.current = value;
      onSearch(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [keyword, onSearch]);

  const submit = () => {
    const value = keyword.trim();
    if (value === lastDispatchedKeyword.current) return;
    lastDispatchedKeyword.current = value;
    onSearch(value);
  };

  return (
    <View style={styles.searchBox}>
      <TextInput value={keyword} onChangeText={setKeyword} onSubmitEditing={submit} returnKeyType="search" placeholder="Bạn muốn tra từ gì?" placeholderTextColor="#98a2b3" style={styles.searchInput} />
      {/* <Pressable onPress={submit} style={styles.searchButton}><Text style={styles.searchButtonText}>Tra cứu</Text></Pressable> */}
      {keyword.length > 0 && (
        <Pressable onPress={() => setKeyword('')} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}
