import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../theme';

interface SearchBoxProps {
  onSearch: (keyword: string) => void;
  onClear: () => void;
}

export default function SearchBox({ onSearch, onClear }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');
  const submit = () => {
    const value = keyword.trim();
    if (value) onSearch(value);
  };

  return (
    <View style={styles.searchBox}>
      <TextInput value={keyword} onChangeText={setKeyword} onSubmitEditing={submit} returnKeyType="search" placeholder="Bạn muốn tra từ gì?" placeholderTextColor="#98a2b3" style={styles.searchInput} />
      {keyword ? <Pressable onPress={() => { setKeyword(''); onClear(); }} accessibilityLabel="Xóa nội dung tìm kiếm"><Text style={styles.clearText}>×</Text></Pressable> : null}
      <Pressable onPress={submit} style={styles.searchButton}><Text style={styles.searchButtonText}>Tra cứu</Text></Pressable>
    </View>
  );
}
