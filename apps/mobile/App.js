import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getSession, onAuthStateChange, signIn, signOut, signUp } from './services/authService';
import { getRandomWord, getWordsPage } from './services/wordService';
import {
  addFavorite,
  addSearchHistory,
  createContribution,
  deleteContribution,
  deleteSearchHistoryItem,
  getAccount,
  getContributions,
  getFavoriteIds,
  getFavorites,
  getSearchHistory,
  removeFavorite,
  updateAccount,
} from './services/profileService';

const COLORS = {
  ink: '#1d2939',
  muted: '#667085',
  paper: '#f8fafc',
  card: '#ffffff',
  primary: '#1d6b5b',
  primaryDark: '#124c41',
  accent: '#e9b949',
  line: '#e5e7eb',
  danger: '#b42318',
};

function Header({ user, onProfile, onLogin, onLogout }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>S&apos;TIÊNG</Text>
        <Text style={styles.brandSub}>TỪ ĐIỂN TRỰC TUYẾN</Text>
      </View>
      {user ? (
        <View style={styles.headerActions}>
          <Pressable onPress={onProfile} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.email || 'U')[0].toUpperCase()}</Text>
          </Pressable>
          <Pressable onPress={onLogout}><Text style={styles.headerLink}>Thoát</Text></Pressable>
        </View>
      ) : (
        <Pressable onPress={onLogin}><Text style={styles.headerLink}>Đăng nhập</Text></Pressable>
      )}
    </View>
  );
}

function SearchBox({ onSearch, onClear }) {
  const [keyword, setKeyword] = useState('');
  const submit = () => {
    const value = keyword.trim();
    if (value) onSearch(value);
  };
  return (
    <View style={styles.searchBox}>
      <TextInput
        value={keyword}
        onChangeText={setKeyword}
        onSubmitEditing={submit}
        returnKeyType="search"
        placeholder="Bạn muốn tra từ gì?"
        placeholderTextColor="#98a2b3"
        style={styles.searchInput}
      />
      {keyword ? <Pressable onPress={() => { setKeyword(''); onClear(); }}><Text style={styles.clearText}>×</Text></Pressable> : null}
      <Pressable onPress={submit} style={styles.searchButton}><Text style={styles.searchButtonText}>Tra cứu</Text></Pressable>
    </View>
  );
}

function AuthModal({ visible, onClose }) {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password || (registering && !fullName.trim())) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (registering) {
        await signUp({ fullName, email, password });
        Alert.alert('Đăng ký thành công', 'Hãy kiểm tra email để xác nhận tài khoản.');
        setRegistering(false);
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (submitError) {
      setError(submitError.message || 'Không thể thực hiện. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.authCard}>
          <Pressable onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
          <Text style={styles.eyebrow}>TỪ ĐIỂN S&apos;TIÊNG</Text>
          <Text style={styles.modalTitle}>{registering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</Text>
          <Text style={styles.modalSubtitle}>{registering ? 'Cùng đóng góp và khám phá ngôn ngữ.' : 'Đăng nhập để lưu những từ bạn yêu thích.'}</Text>
          {registering ? <TextInput value={fullName} onChangeText={setFullName} placeholder="Họ và tên" style={styles.formInput} /> : null}
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" style={styles.formInput} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mật khẩu" style={styles.formInput} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable disabled={busy} onPress={submit} style={styles.primaryButton}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{registering ? 'Đăng ký' : 'Đăng nhập'}</Text>}
          </Pressable>
          <Pressable onPress={() => setRegistering((value) => !value)} style={styles.switchAuth}>
            <Text style={styles.switchAuthText}>{registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function WordOfDay() {
  const [word, setWord] = useState(null);
  useEffect(() => {
    const load = async () => {
      const date = new Date().toISOString().slice(0, 10);
      const cached = await AsyncStorage.getItem('wordOfTheDay');
      if (cached) {
        const saved = JSON.parse(cached);
        if (saved.date === date) { setWord(saved.word); return; }
      }
      const fresh = await getRandomWord();
      if (fresh) {
        setWord(fresh);
        await AsyncStorage.setItem('wordOfTheDay', JSON.stringify({ date, word: fresh }));
      }
    };
    load().catch(() => {});
  }, []);
  if (!word) return null;
  return (
    <View style={styles.wordDayCard}>
      <Text style={styles.sectionKicker}>GỢI Ý HÔM NAY</Text>
      <Text style={styles.wordDayTitle}>{word.word_st}</Text>
      <Text style={styles.wordPos}>{word.pos || 'Từ vựng'}</Text>
      <Text style={styles.wordMeaning}>{word.word_vi} · {word.meaning}</Text>
      {word.example ? <Text style={styles.example}>“{word.example}”</Text> : null}
    </View>
  );
}

function WordCard({ item, favorite, onFavorite, signedIn }) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.wordCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.wordTitle}>{item.word_st}</Text>
          <Text style={styles.wordPos}>{item.pos || 'Từ vựng'}</Text>
        </View>
        {signedIn ? <Pressable onPress={() => onFavorite(item.id)}><Text style={favorite ? styles.favoriteActive : styles.favorite}>★</Text></Pressable> : null}
      </View>
      <Text style={styles.translation}>{item.word_vi}</Text>
      <Text style={styles.definition}>{item.meaning}</Text>
      {item.example ? <Text style={styles.example}>“{item.example}”</Text> : null}
    </View>
  );
}

function HomeScreen({ user, onLogin }) {
  const [keyword, setKeyword] = useState('');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    let active = true;
    getWordsPage({ page, pageSize: 10, searchKeyword: keyword })
      .then((result) => { if (active) { setWords(result.words); setTotalPages(result.totalPages); } })
      .catch(() => { if (active) Alert.alert('Không thể tải dữ liệu', 'Vui lòng kiểm tra kết nối và thử lại.'); })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, keyword]);

  useEffect(() => {
    if (!user || !words.length) return;
    getFavoriteIds(words.map((item) => item.id)).then(setFavorites).catch(() => {});
  }, [user, words]);

  const search = async (value) => {
    setLoading(true);
    setKeyword(value);
    setPage(1);
    if (user) addSearchHistory(value).catch(() => {});
  };
  const toggleFavorite = async (id) => {
    if (!user) { onLogin(); return; }
    try {
      if (favorites.has(id)) {
        await removeFavorite(id);
        setFavorites((current) => new Set([...current].filter((value) => value !== id)));
      } else {
        await addFavorite(id);
        setFavorites((current) => new Set(current).add(id));
      }
    } catch (error) { Alert.alert('Không thể cập nhật', error.message); }
  };

  return (
    <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>KHÁM PHÁ NGÔN NGỮ</Text>
        <Text style={styles.heroTitle}>Tìm đúng từ,{'\n'}hiểu sâu hơn.</Text>
        <Text style={styles.heroSubtitle}>Tra cứu từ điển S&apos;tiêng mọi lúc, ngay trên điện thoại.</Text>
        <SearchBox onSearch={search} onClear={() => { setLoading(true); setKeyword(''); setPage(1); }} />
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

function ProfileScreen({ user, onBack, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState({ full_name: '', avatar_url: '' });
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [form, setForm] = useState({ word: '', definition: '', part_of_speech: '', phonetic: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => Promise.all([getAccount(), getFavorites(), getSearchHistory(), getContributions()])
    .then(([account, saved, searched, created]) => { setProfile({ full_name: account.full_name || '', avatar_url: account.avatar_url || '' }); setFavorites(saved); setHistory(searched); setContributions(created); })
    .catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try { await updateAccount(profile); setMessage('Đã cập nhật thông tin cá nhân.'); } catch (saveError) { setError(saveError.message); }
  };
  const contribute = async () => {
    if (!form.word.trim() || !form.definition.trim()) return;
    try { const created = await createContribution(form); setContributions((items) => [created, ...items]); setForm({ word: '', definition: '', part_of_speech: '', phonetic: '' }); setMessage('Đóng góp đang chờ kiểm duyệt.'); } catch (submitError) { setError(submitError.message); }
  };
  const tabs = [['overview', 'Cá nhân'], ['favorites', `Yêu thích (${favorites.length})`], ['history', 'Lịch sử'], ['contributions', 'Đóng góp']];
  return (
    <ScrollView contentContainerStyle={styles.profileContent}>
      <View style={styles.profileTop}><Pressable onPress={onBack}><Text style={styles.backText}>‹ Tra cứu</Text></Pressable><Pressable onPress={onLogout}><Text style={styles.headerLink}>Đăng xuất</Text></Pressable></View>
      <Text style={styles.sectionKicker}>KHÔNG GIAN CÁ NHÂN</Text>
      <Text style={styles.profileTitle}>Hồ sơ của bạn</Text>
      <Text style={styles.profileSubtitle}>{user.email}</Text>
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map(([id, label]) => <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.activeTab]}><Text style={[styles.tabText, tab === id && styles.activeTabText]}>{label}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.profileCard}>
        {tab === 'overview' ? <View>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <TextInput value={profile.full_name} onChangeText={(value) => setProfile({ ...profile, full_name: value })} placeholder="Họ và tên" style={styles.formInput} />
          <TextInput value={profile.avatar_url} onChangeText={(value) => setProfile({ ...profile, avatar_url: value })} placeholder="Ảnh đại diện (URL)" style={styles.formInput} />
          <TextInput value={user.email || ''} editable={false} style={[styles.formInput, styles.disabledInput]} />
          <Pressable onPress={save} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Lưu thay đổi</Text></Pressable>
        </View> : null}
        {tab === 'favorites' ? <View><Text style={styles.cardTitle}>Từ yêu thích</Text>{favorites.length ? favorites.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.Words?.word_st || item.Words?.word_vi || item.word_id}</Text><Text style={styles.listDescription}>{item.Words?.meaning || 'Chưa có định nghĩa'}</Text></View>) : <Text style={styles.emptyText}>Bạn chưa lưu từ nào.</Text>}</View> : null}
        {tab === 'history' ? <View><Text style={styles.cardTitle}>Lịch sử tra cứu</Text>{history.length ? history.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.search_query}</Text><Pressable onPress={() => deleteSearchHistoryItem(item.id).then(() => setHistory((items) => items.filter((entry) => entry.id !== item.id)))}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>) : <Text style={styles.emptyText}>Chưa có lịch sử tra cứu.</Text>}</View> : null}
        {tab === 'contributions' ? <View><Text style={styles.cardTitle}>Đóng góp từ vựng</Text>{['word', 'definition', 'part_of_speech', 'phonetic'].map((field) => <TextInput key={field} value={form[field]} onChangeText={(value) => setForm({ ...form, [field]: value })} placeholder={{ word: 'Từ mới *', definition: 'Định nghĩa *', part_of_speech: 'Từ loại', phonetic: 'Phiên âm' }[field]} style={styles.formInput} />)}<Pressable onPress={contribute} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Gửi để kiểm duyệt</Text></Pressable>{contributions.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.word}</Text><Text style={styles.listDescription}>{item.definition} · {item.status}</Text><Pressable onPress={() => deleteContribution(item.id).then(() => setContributions((items) => items.filter((entry) => entry.id !== item.id)))}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>)}</View> : null}
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState('home');
  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    const subscription = onAuthStateChange((_, session) => { setUser(session?.user || null); setAuthLoading(false); });
    getSession().then((session) => setUser(session?.user || null)).catch(() => setUser(null)).finally(() => setAuthLoading(false));
    return () => subscription.unsubscribe();
  }, []);
  const logout = async () => { await signOut(); setUser(null); setScreen('home'); };
  if (authLoading) return <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /><Text style={styles.loadingText}>Đang khởi động...</Text></View>;
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header user={user} onProfile={() => setScreen('profile')} onLogin={() => setAuthVisible(true)} onLogout={logout} />
      {screen === 'home' ? <HomeScreen user={user} onLogin={() => setAuthVisible(true)} /> : <ProfileScreen user={user} onBack={() => setScreen('home')} onLogout={logout} />}
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.paper },
  loadingText: { marginTop: 12, color: COLORS.muted },
  header: { paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  brand: { color: COLORS.primary, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  brandSub: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.2, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLink: { color: COLORS.primary, fontWeight: '700' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#d9eee7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontWeight: '800' },
  homeContent: { paddingBottom: 36 },
  hero: { backgroundColor: '#e7f1ed', padding: 24, paddingTop: 30, paddingBottom: 28 },
  heroKicker: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 10 },
  heroTitle: { color: COLORS.ink, fontSize: 34, lineHeight: 40, fontWeight: '800' },
  heroSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 20 },
  searchBox: { backgroundColor: COLORS.card, borderRadius: 14, padding: 5, flexDirection: 'row', alignItems: 'center', shadowColor: '#123', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  searchInput: { flex: 1, color: COLORS.ink, paddingHorizontal: 12, height: 46, fontSize: 15 },
  clearText: { color: COLORS.muted, fontSize: 26, paddingHorizontal: 8 },
  searchButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '700' },
  wordDayCard: { margin: 20, marginBottom: 8, padding: 20, borderRadius: 18, backgroundColor: COLORS.primaryDark },
  sectionKicker: { color: COLORS.accent, fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  wordDayTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 10 },
  wordPos: { color: '#a9d4c7', fontSize: 13, marginTop: 3 },
  wordMeaning: { color: '#e2f2ed', fontSize: 15, lineHeight: 22, marginTop: 12 },
  example: { color: COLORS.muted, fontStyle: 'italic', marginTop: 10, lineHeight: 20 },
  resultsHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '800' },
  pageLabel: { color: COLORS.muted, fontSize: 13 },
  wordCard: { marginHorizontal: 20, marginVertical: 6, padding: 17, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line },
  wordCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  wordTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '800' },
  favorite: { color: '#cbd5e1', fontSize: 26, paddingLeft: 12 },
  favoriteActive: { color: COLORS.accent, fontSize: 26, paddingLeft: 12 },
  translation: { color: COLORS.primary, fontSize: 16, fontWeight: '700', marginTop: 10 },
  definition: { color: COLORS.muted, lineHeight: 21, marginTop: 5 },
  emptyText: { color: COLORS.muted, textAlign: 'center', margin: 28 },
  pagination: { padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  pageButton: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  disabled: { color: '#b8c0cc' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16, 24, 40, .45)' },
  authCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  closeButton: { alignSelf: 'flex-end', padding: 4 },
  closeText: { color: COLORS.muted, fontSize: 28 },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 8 },
  modalTitle: { color: COLORS.ink, fontSize: 27, fontWeight: '800', marginTop: 8 },
  modalSubtitle: { color: COLORS.muted, lineHeight: 21, marginTop: 6, marginBottom: 18 },
  formInput: { height: 48, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, paddingHorizontal: 14, color: COLORS.ink, marginBottom: 11, backgroundColor: '#fff' },
  primaryButton: { backgroundColor: COLORS.primary, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  switchAuth: { alignItems: 'center', paddingTop: 18 },
  switchAuthText: { color: COLORS.primary, fontWeight: '700' },
  errorText: { color: COLORS.danger, marginBottom: 10, lineHeight: 19 },
  profileContent: { padding: 20, paddingBottom: 40 },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  backText: { color: COLORS.primary, fontWeight: '700' },
  profileTitle: { color: COLORS.ink, fontSize: 30, fontWeight: '800', marginTop: 8 },
  profileSubtitle: { color: COLORS.muted, marginTop: 5, marginBottom: 20 },
  successText: { color: COLORS.primary, backgroundColor: '#e7f1ed', padding: 11, borderRadius: 8, marginBottom: 12 },
  tabs: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 16 },
  tab: { paddingVertical: 10, paddingHorizontal: 13, marginRight: 7, borderRadius: 20, backgroundColor: '#eef2f3' },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#fff' },
  profileCard: { backgroundColor: COLORS.card, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, padding: 16 },
  cardTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '800', marginBottom: 15 },
  disabledInput: { color: COLORS.muted, backgroundColor: '#f2f4f7' },
  listItem: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.line, position: 'relative', paddingRight: 42 },
  listTitle: { color: COLORS.ink, fontWeight: '700', fontSize: 15 },
  listDescription: { color: COLORS.muted, lineHeight: 20, marginTop: 4 },
  deleteText: { color: COLORS.danger, fontSize: 12, fontWeight: '700', position: 'absolute', right: 0, top: 15 },
});
