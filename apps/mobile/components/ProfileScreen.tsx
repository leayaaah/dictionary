import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  createContribution,
  deleteContribution,
  deleteSearchHistoryItem,
  getAccount,
  getContributions,
  getFavorites,
  getSearchHistory,
  updateAccount,
} from '../services/profileService';
import type { AuthUser, Contribution, FavoriteRecord, HistoryRecord, ProfileDetails, ProfileTab } from '../types';
import { styles } from '../theme';

interface ProfileScreenProps {
  user: AuthUser;
  onBack: () => void;
  onLogout: () => void;
}

interface ContributionForm {
  word: string;
  definition: string;
  part_of_speech: string;
  phonetic: string;
}

interface AccountRecord {
  full_name?: string | null;
  avatar_url?: string | null;
}

const contributionFields: Array<{ key: keyof ContributionForm; placeholder: string }> = [
  { key: 'word', placeholder: 'Từ mới *' },
  { key: 'definition', placeholder: 'Định nghĩa *' },
  { key: 'part_of_speech', placeholder: 'Từ loại' },
  { key: 'phonetic', placeholder: 'Phiên âm' },
];

export default function ProfileScreen({ user, onBack, onLogout }: ProfileScreenProps) {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [profile, setProfile] = useState<ProfileDetails>({ full_name: '', avatar_url: '' });
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [form, setForm] = useState<ContributionForm>({ word: '', definition: '', part_of_speech: '', phonetic: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getAccount(), getFavorites(), getSearchHistory(), getContributions()])
      .then(([account, saved, searched, created]) => {
        if (!active) return;
        const accountDetails = account as AccountRecord;
        setProfile({ full_name: accountDetails.full_name || '', avatar_url: accountDetails.avatar_url || '' });
        setFavorites(saved as FavoriteRecord[]);
        setHistory(searched as HistoryRecord[]);
        setContributions(created as Contribution[]);
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ.'); });
    return () => { active = false; };
  }, []);

  const save = async () => {
    try {
      await updateAccount(profile);
      setMessage('Đã cập nhật thông tin cá nhân.');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu thông tin.');
    }
  };

  const contribute = async () => {
    if (!form.word.trim() || !form.definition.trim()) return;
    try {
      const created = await createContribution(form) as Contribution;
      setContributions((items) => [created, ...items]);
      setForm({ word: '', definition: '', part_of_speech: '', phonetic: '' });
      setMessage('Đóng góp đang chờ kiểm duyệt.');
      setError('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi đóng góp.');
    }
  };

  const tabs: Array<[ProfileTab, string]> = [
    ['overview', 'Cá nhân'],
    ['favorites', `Yêu thích (${favorites.length})`],
    ['history', 'Lịch sử'],
    ['contributions', 'Đóng góp'],
  ];

  return (
    <ScrollView contentContainerStyle={styles.profileContent}>
      <View style={styles.profileTop}>
        <Pressable onPress={onBack}><Text style={styles.backText}>‹ Tra cứu</Text></Pressable>
        <Pressable onPress={onLogout}><Text style={styles.headerLink}>Đăng xuất</Text></Pressable>
      </View>
      <Text style={styles.sectionKicker}>KHÔNG GIAN CÁ NHÂN</Text>
      <Text style={styles.profileTitle}>Hồ sơ của bạn</Text>
      <Text style={styles.profileSubtitle}>{user.email}</Text>
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map(([id, label]) => <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.activeTab]}><Text style={[styles.tabText, tab === id && styles.activeTabText]}>{label}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.profileCard}>
        {tab === 'overview' ? (
          <View>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
            <TextInput value={profile.full_name} onChangeText={(value) => setProfile({ ...profile, full_name: value })} placeholder="Họ và tên" style={styles.formInput} />
            <TextInput value={profile.avatar_url} onChangeText={(value) => setProfile({ ...profile, avatar_url: value })} placeholder="Ảnh đại diện (URL)" style={styles.formInput} />
            <TextInput value={user.email || ''} editable={false} style={[styles.formInput, styles.disabledInput]} />
            <Pressable onPress={save} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Lưu thay đổi</Text></Pressable>
          </View>
        ) : null}
        {tab === 'favorites' ? (
          <View>
            <Text style={styles.cardTitle}>Từ yêu thích</Text>
            {favorites.length ? favorites.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.Words?.word_st || item.Words?.word_vi || item.word_id}</Text><Text style={styles.listDescription}>{item.Words?.meaning || 'Chưa có định nghĩa'}</Text></View>) : <Text style={styles.emptyText}>Bạn chưa lưu từ nào.</Text>}
          </View>
        ) : null}
        {tab === 'history' ? (
          <View>
            <Text style={styles.cardTitle}>Lịch sử tra cứu</Text>
            {history.length ? history.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.search_query}</Text><Pressable onPress={() => deleteSearchHistoryItem(item.id).then(() => setHistory((items) => items.filter((entry) => entry.id !== item.id)))}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>) : <Text style={styles.emptyText}>Chưa có lịch sử tra cứu.</Text>}
          </View>
        ) : null}
        {tab === 'contributions' ? (
          <View>
            <Text style={styles.cardTitle}>Đóng góp từ vựng</Text>
            {contributionFields.map(({ key, placeholder }) => <TextInput key={key} value={form[key]} onChangeText={(value) => setForm({ ...form, [key]: value })} placeholder={placeholder} style={styles.formInput} />)}
            <Pressable onPress={contribute} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Gửi để kiểm duyệt</Text></Pressable>
            {contributions.map((item) => <View style={styles.listItem} key={item.id}><Text style={styles.listTitle}>{item.word}</Text><Text style={styles.listDescription}>{item.definition} · {item.status}</Text><Pressable onPress={() => deleteContribution(item.id).then(() => setContributions((items) => items.filter((entry) => entry.id !== item.id)))}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>)}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
