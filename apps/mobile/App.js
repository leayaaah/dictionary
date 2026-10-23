import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  getRandomWord,
  getSearchHistory,
  getSession,
  getWordsPage,
  isConfigured,
  onAuthStateChange,
  removeFavorite,
  signIn,
  signOut,
  signUp,
  updateAccount,
} from './src/api';

const PAGE_SIZE = 10;
const COLORS = { ink: '#20302d', muted: '#71807c', green: '#2c6e61', pale: '#f0f5f1', gold: '#d59a42', border: '#dbe5df' };
const emptyContribution = { word: '', definition: '', part_of_speech: '', phonetic: '' };

function Button({ children, onPress, secondary = false, disabled = false, style }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabledButton, style]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{children}</Text>
    </Pressable>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor="#9aa9a4" style={styles.input} {...props} />
    </View>
  );
}

function WordCard({ item, isFavorite, onToggleFavorite }) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.wordTitle}>{item.word_st}</Text>
          <Text style={styles.pos}>{item.pos || 'Chưa phân loại'}</Text>
        </View>
        {onToggleFavorite && <Pressable onPress={onToggleFavorite} accessibilityLabel={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}><Text style={[styles.star, isFavorite && styles.favoriteStar]}>{isFavorite ? '★' : '☆'}</Text></Pressable>}
      </View>
      <Text style={styles.detail}><Text style={styles.detailLabel}>Tiếng Việt: </Text>{item.word_vi || '—'}</Text>
      <Text style={styles.detail}><Text style={styles.detailLabel}>Ý nghĩa: </Text>{item.meaning || '—'}</Text>
      {item.example ? <Text style={styles.example}>Ví dụ: “{item.example}”</Text> : null}
    </View>
  );
}

function AuthModal({ visible, onClose }) {
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!email.trim() || !password || (registering && !fullName.trim())) {
      setMessage('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (registering) {
        const result = await signUp({ fullName, email, password });
        setMessage(result.session ? 'Đăng ký thành công.' : 'Hãy kiểm tra email để xác nhận tài khoản.');
        setPassword('');
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (error) {
      setMessage(error.message || 'Không thể thực hiện. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
          <Text style={styles.eyebrow}>TỪ ĐIỂN S&apos;TIÊNG</Text>
          <Text style={styles.modalTitle}>{registering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</Text>
          <Text style={styles.modalSubtitle}>{registering ? 'Lưu lại từ ngữ và đóng góp cho cộng đồng.' : 'Đăng nhập để lưu những từ bạn yêu thích.'}</Text>
          {registering && <Input label="Họ và tên" placeholder="Nhập họ và tên" value={fullName} onChangeText={setFullName} />}
          <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Input label="Mật khẩu" placeholder="Ít nhất 6 ký tự" secureTextEntry value={password} onChangeText={setPassword} />
          {message ? <Text style={styles.errorText}>{message}</Text> : null}
          <Button onPress={submit} disabled={busy}>{busy ? 'Đang xử lý...' : registering ? 'Tạo tài khoản' : 'Đăng nhập'}</Button>
          <Pressable onPress={() => { setRegistering(!registering); setMessage(''); }}><Text style={styles.link}>{registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function HomeScreen({ user, onOpenAuth }) {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [words, setWords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [wordOfDay, setWordOfDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getWordsPage({ page, pageSize: PAGE_SIZE, searchKeyword: keyword });
      setWords(result.words);
      setTotalPages(result.totalPages);
      if (user && result.words.length) setFavoriteIds(await getFavoriteIds(result.words.map((word) => word.id)));
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, user]);

  // The request synchronizes the list with the current search and page.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadWords(); }, [loadWords]);
  useEffect(() => {
    if (keyword) return undefined;
    getRandomWord().then(setWordOfDay).catch(() => {});
    return undefined;
  }, [keyword]);

  const search = () => {
    const value = searchInput.trim();
    setKeyword(value);
    setPage(1);
    if (user && value) addSearchHistory(value).catch(() => {});
  };

  const toggleFavorite = async (id) => {
    if (!user) { onOpenAuth(); return; }
    try {
      if (favoriteIds.has(id)) await removeFavorite(id);
      else await addFavorite(id);
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } catch (toggleError) { Alert.alert('Không thể cập nhật', toggleError.message); }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TỪ ĐIỂN S&apos;TIÊNG</Text>
        <Text style={styles.heroTitle}>Khám phá ngôn ngữ{'\n'}của chúng ta</Text>
        <Text style={styles.heroSubtitle}>Tra cứu, học hỏi và góp phần gìn giữ tiếng S&apos;tiêng.</Text>
        <View style={styles.searchRow}><TextInput style={styles.searchInput} placeholder="Bạn muốn tra từ gì?" placeholderTextColor="#91a09b" value={searchInput} onChangeText={setSearchInput} onSubmitEditing={search} returnKeyType="search" /><Button onPress={search} style={styles.searchButton}>Tra cứu</Button></View>
      </View>
      {!keyword && wordOfDay && <View><Text style={styles.sectionTitle}>Từ của ngày</Text><WordCard item={wordOfDay} /></View>}
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{keyword ? `Kết quả cho “${keyword}”` : 'Danh sách từ vựng'}</Text>{keyword ? <Pressable onPress={() => { setSearchInput(''); setKeyword(''); setPage(1); }}><Text style={styles.link}>Xóa lọc</Text></Pressable> : null}</View>
      {error ? <Text style={styles.errorText}>{error}</Text> : loading ? <ActivityIndicator color={COLORS.green} style={{ margin: 30 }} /> : words.length ? words.map((item) => <WordCard key={item.id} item={item} isFavorite={favoriteIds.has(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} />) : <Text style={styles.empty}>{keyword ? 'Không tìm thấy từ phù hợp.' : 'Chưa có từ vựng nào.'}</Text>}
      {totalPages > 1 && <View style={styles.pagination}><Button secondary disabled={page === 1} onPress={() => setPage((value) => value - 1)}>Trước</Button><Text style={styles.pageText}>Trang {page} / {totalPages}</Text><Button secondary disabled={page === totalPages} onPress={() => setPage((value) => value + 1)}>Sau</Button></View>}
      <View style={styles.about}><Text style={styles.sectionTitle}>Về chúng tôi</Text><Text style={styles.aboutText}>Dự án từ điển trực tuyến nhằm bảo tồn và phát triển tiếng S&apos;tiêng.</Text></View>
      <Text style={styles.footer}>© 2026 THUYLY</Text>
    </ScrollView>
  );
}

function ProfileScreen({ user, onBack, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState({ full_name: '', avatar_url: '' });
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [form, setForm] = useState(emptyContribution);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAccount(), getFavorites(), getSearchHistory(), getContributions()])
      .then(([account, savedFavorites, savedHistory, savedContributions]) => {
        setProfile({ full_name: account.full_name || '', avatar_url: account.avatar_url || '' });
        setFavorites(savedFavorites); setHistory(savedHistory); setContributions(savedContributions);
      }).catch((loadError) => setError(loadError.message || 'Không thể tải hồ sơ.'));
  }, []);

  const saveProfile = async () => {
    try { await updateAccount(profile); setMessage('Đã cập nhật thông tin cá nhân.'); } catch (saveError) { setError(saveError.message); }
  };
  const submitContribution = async () => {
    if (!form.word.trim() || !form.definition.trim()) { setError('Từ mới và định nghĩa là bắt buộc.'); return; }
    try { const created = await createContribution(form); setContributions((items) => [created, ...items]); setForm(emptyContribution); setMessage('Đóng góp đã được gửi và chờ kiểm duyệt.'); } catch (submitError) { setError(submitError.message); }
  };

  const tabs = [['overview', 'Cá nhân'], ['favorites', `Yêu thích (${favorites.length})`], ['history', 'Lịch sử'], ['contributions', 'Đóng góp']];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}><Pressable onPress={onBack}><Text style={styles.link}>‹ Tra cứu</Text></Pressable><Text style={styles.eyebrow}>KHÔNG GIAN CÁ NHÂN</Text><Text style={styles.heroTitle}>Hồ sơ của bạn</Text><Text style={styles.heroSubtitle}>{user.email}</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>{tabs.map(([id, label]) => <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.activeTab]}><Text style={[styles.tabText, tab === id && styles.activeTabText]}>{label}</Text></Pressable>)}</ScrollView>
      {message ? <Text style={styles.successText}>{message}</Text> : null}{error ? <Text style={styles.errorText}>{error}</Text> : null}
      {tab === 'overview' && <View style={styles.panel}><Text style={styles.panelTitle}>Thông tin cá nhân</Text><Input label="Họ và tên" value={profile.full_name} onChangeText={(value) => setProfile({ ...profile, full_name: value })} /><Input label="Ảnh đại diện (URL)" value={profile.avatar_url} onChangeText={(value) => setProfile({ ...profile, avatar_url: value })} placeholder="https://..." /><Input label="Email" value={user.email || ''} editable={false} /><Button onPress={saveProfile}>Lưu thay đổi</Button></View>}
      {tab === 'favorites' && <View style={styles.panel}><Text style={styles.panelTitle}>Từ yêu thích</Text>{favorites.length ? favorites.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.Words?.word_st || item.Words?.word_vi || item.word_id}</Text><Text style={styles.muted}>{item.Words?.meaning || item.Words?.word_vi || 'Chưa có định nghĩa'}</Text></View>) : <Text style={styles.empty}>Bạn chưa lưu từ nào.</Text>}</View>}
      {tab === 'history' && <View style={styles.panel}><Text style={styles.panelTitle}>Lịch sử tra cứu</Text>{history.length ? history.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.search_query}</Text><Text style={styles.muted}>{new Date(item.searched_at).toLocaleString('vi-VN')}</Text><Pressable onPress={async () => { await deleteSearchHistoryItem(item.id); setHistory((items) => items.filter((entry) => entry.id !== item.id)); }}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>) : <Text style={styles.empty}>Chưa có lịch sử tra cứu.</Text>}</View>}
      {tab === 'contributions' && <View style={styles.panel}><Text style={styles.panelTitle}>Đóng góp từ vựng</Text><Input placeholder="Từ mới *" value={form.word} onChangeText={(value) => setForm({ ...form, word: value })} /><Input placeholder="Định nghĩa *" value={form.definition} onChangeText={(value) => setForm({ ...form, definition: value })} /><Input placeholder="Từ loại" value={form.part_of_speech} onChangeText={(value) => setForm({ ...form, part_of_speech: value })} /><Input placeholder="Phiên âm" value={form.phonetic} onChangeText={(value) => setForm({ ...form, phonetic: value })} /><Button onPress={submitContribution}>Gửi để kiểm duyệt</Button>{contributions.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.word}</Text><Text style={styles.muted}>{item.definition}</Text><Text style={styles.status}>{item.status}</Text>{item.status === 'pending' && <Pressable onPress={async () => { await deleteContribution(item.id); setContributions((items) => items.filter((entry) => entry.id !== item.id)); }}><Text style={styles.deleteText}>Xóa</Text></Pressable>}</View>)}</View>}
      <Button secondary onPress={onLogout} style={{ marginTop: 16 }}>Đăng xuất</Button>
    </ScrollView>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isConfigured);
  const [authVisible, setAuthVisible] = useState(false);
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    if (!isConfigured) return undefined;
    let mounted = true;
    const subscription = onAuthStateChange((_event, session) => { if (mounted) setUser(session?.user || null); setAuthReady(true); });
    getSession().then((session) => { if (mounted) setUser(session?.user || null); }).catch(() => {}).finally(() => { if (mounted) setAuthReady(true); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const displayName = useMemo(() => user?.user_metadata?.full_name || user?.email || 'Tài khoản', [user]);
  const logout = async () => { try { await signOut(); setUser(null); setScreen('home'); } catch (error) { Alert.alert('Không thể đăng xuất', error.message); } };

  if (!isConfigured) return <SafeAreaView style={styles.safe}><View style={styles.config}><Text style={styles.heroTitle}>Từ điển S&apos;tiêng</Text><Text style={styles.errorText}>Chưa có cấu hình Supabase. Hãy tạo file apps/mobile/.env từ .env.example và điền EXPO_PUBLIC_SUPABASE_URL cùng EXPO_PUBLIC_SUPABASE_ANON_KEY.</Text></View><StatusBar style="dark" /></SafeAreaView>;
  if (!authReady) return <SafeAreaView style={styles.safe}><ActivityIndicator color={COLORS.green} style={{ flex: 1 }} /><StatusBar style="dark" /></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><View style={styles.appHeader}><Text style={styles.logo}>Từ điển S&apos;tiêng</Text>{user ? <Pressable onPress={() => setScreen('profile')}><Text style={styles.headerAction}>{displayName}</Text></Pressable> : <Pressable onPress={() => setAuthVisible(true)}><Text style={styles.headerAction}>Đăng nhập</Text></Pressable>}</View>{screen === 'home' ? <HomeScreen user={user} onOpenAuth={() => setAuthVisible(true)} /> : <ProfileScreen user={user} onBack={() => setScreen('home')} onLogout={logout} />}<AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} /><StatusBar style="dark" /></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fbfcfa' }, content: { paddingBottom: 36 }, appHeader: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#fff' }, logo: { color: COLORS.ink, fontWeight: '800', fontSize: 17 }, headerAction: { color: COLORS.green, fontWeight: '700', maxWidth: 160 }, hero: { backgroundColor: COLORS.pale, padding: 24, paddingTop: 30, paddingBottom: 28 }, eyebrow: { color: COLORS.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 }, heroTitle: { color: COLORS.ink, fontSize: 29, lineHeight: 35, fontWeight: '800' }, heroSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 10 }, searchRow: { flexDirection: 'row', marginTop: 20, gap: 8 }, searchInput: { flex: 1, minWidth: 0, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, color: COLORS.ink, borderWidth: 1, borderColor: COLORS.border }, searchButton: { paddingHorizontal: 15 }, sectionTitle: { color: COLORS.ink, fontSize: 21, fontWeight: '800', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, wordCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, padding: 17, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#17372c', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }, wordHeader: { flexDirection: 'row', alignItems: 'flex-start' }, wordTitle: { color: COLORS.green, fontSize: 22, fontWeight: '800' }, pos: { color: COLORS.muted, fontStyle: 'italic', marginTop: 2 }, star: { fontSize: 29, color: '#9aa9a4', paddingLeft: 10 }, favoriteStar: { color: COLORS.gold }, detail: { color: COLORS.ink, lineHeight: 21, marginTop: 11 }, detailLabel: { fontWeight: '800' }, example: { color: COLORS.muted, fontStyle: 'italic', marginTop: 11 }, button: { backgroundColor: COLORS.green, borderRadius: 9, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border }, secondaryButtonText: { color: COLORS.green }, disabledButton: { opacity: 0.45 }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 20 }, pageText: { color: COLORS.muted, fontWeight: '700' }, about: { backgroundColor: COLORS.pale, marginTop: 20, paddingBottom: 20 }, aboutText: { color: COLORS.muted, paddingHorizontal: 20, lineHeight: 22 }, footer: { textAlign: 'center', color: COLORS.muted, padding: 24 }, empty: { textAlign: 'center', color: COLORS.muted, padding: 24 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 35, 30, 0.42)' }, modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 34 }, close: { alignSelf: 'flex-end', padding: 4 }, closeText: { fontSize: 28, color: COLORS.muted }, modalTitle: { color: COLORS.ink, fontSize: 27, fontWeight: '800' }, modalSubtitle: { color: COLORS.muted, marginTop: 7, marginBottom: 13 }, field: { marginTop: 12 }, label: { color: COLORS.ink, fontWeight: '700', marginBottom: 6 }, input: { minHeight: 47, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, paddingHorizontal: 13, color: COLORS.ink, backgroundColor: '#fff' }, errorText: { color: '#b1463b', lineHeight: 20, marginVertical: 12 }, successText: { color: '#2d7957', marginHorizontal: 20, marginTop: 14 }, link: { color: COLORS.green, fontWeight: '800', textAlign: 'center', marginTop: 16 }, profileHeader: { padding: 20, backgroundColor: COLORS.pale }, tabs: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }, tab: { paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 3, borderRadius: 20 }, activeTab: { backgroundColor: COLORS.green }, tabText: { color: COLORS.muted, fontWeight: '700' }, activeTabText: { color: '#fff' }, panel: { margin: 20, padding: 17, backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: COLORS.border }, panelTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '800', marginBottom: 5 }, listItem: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 14 }, listTitle: { color: COLORS.ink, fontWeight: '800', fontSize: 16 }, muted: { color: COLORS.muted, lineHeight: 20, marginTop: 4 }, deleteText: { color: '#b1463b', fontWeight: '700', marginTop: 8 }, status: { color: COLORS.green, fontSize: 12, marginTop: 7, textTransform: 'uppercase' }, config: { padding: 24, marginTop: 80 },
});
