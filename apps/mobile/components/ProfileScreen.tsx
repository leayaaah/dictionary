import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  createContribution,
  deleteContribution,
  deleteSearchHistoryItem,
  getAccount,
  getContributions,
  getFavorites,
  getSearchHistory,
  removeProfileAvatarByUrl,
  updateAccount,
  uploadProfileAvatar,
} from '../services/profileService';
import type { AuthUser, Contribution, FavoriteRecord, HistoryRecord, ProfileDetails, ProfileTab } from '../types';
import { styles } from '../theme';

interface ProfileScreenProps {
  user: AuthUser;
  onBack: () => void;
  onAvatarChanged: (avatarUrl: string) => void;
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

function ProfileScreen({ user, onBack, onAvatarChanged }: ProfileScreenProps) {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [profile, setProfile] = useState<ProfileDetails>({ full_name: '', avatar_url: '' });
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [form, setForm] = useState<ContributionForm>({ word: '', definition: '', part_of_speech: '', phonetic: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!user?.id) {
      return () => { active = false; };
    }

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
  }, [user?.id]);

  const save = async () => {
    try {
      await updateAccount(profile);
      setMessage('Đã cập nhật thông tin cá nhân.');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu thông tin.');
    }
  };

  const chooseAvatar = async () => {
    setError('');
    setMessage('');
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (selection.canceled || !selection.assets.length) return;

      const asset = selection.assets[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType || '')) {
        setError('Ảnh đại diện cần có định dạng JPG, PNG hoặc WebP.');
        return;
      }
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setError('Ảnh đại diện không được vượt quá 5 MB.');
        return;
      }

      setIsAvatarUploading(true);
      let uploadedAvatar: { path: string; publicUrl: string } | undefined;
      const previousAvatarUrl = profile.avatar_url;
      try {
        const avatar = await uploadProfileAvatar(asset, user.id);
        uploadedAvatar = avatar;
        await updateAccount({ ...profile, avatar_url: avatar.publicUrl });
        setProfile((current) => ({ ...current, avatar_url: avatar.publicUrl }));
        onAvatarChanged(avatar.publicUrl);
        setMessage('Ảnh đại diện đã được cập nhật.');
        if (previousAvatarUrl && previousAvatarUrl !== avatar.publicUrl) {
          removeProfileAvatarByUrl(previousAvatarUrl, user.id).catch((cleanupError: unknown) => console.warn('Không thể xóa ảnh đại diện cũ:', cleanupError));
        }
      } catch (uploadError) {
        if (uploadedAvatar) {
          removeProfileAvatarByUrl(uploadedAvatar.publicUrl, user.id).catch(() => {});
        }
        const errorMessage = uploadError instanceof Error ? uploadError.message : '';
        setError(/bucket not found/i.test(errorMessage)
          ? 'Không tìm thấy bucket profile-avatars trên Supabase. Hãy áp dụng migration 202610241300_profile_avatar_storage.sql rồi thử lại.'
          : errorMessage || 'Không thể tải ảnh đại diện lên. Vui lòng thử lại.');
      } finally {
        setIsAvatarUploading(false);
      }
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Không thể mở thư viện ảnh.');
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
  const displayName = profile.full_name.trim() || user.email?.split('@')[0] || 'Bạn';
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  return (
    <ScrollView contentContainerStyle={styles.profileContent}>
      <View style={styles.profileTop}>
        <Pressable onPress={onBack}><Text style={styles.backText}>‹ Tra cứu</Text></Pressable>
      </View>
      <View style={styles.profileSummaryCard}>
        <View style={styles.profileAvatarWrap}>
          {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatarImage} /> : <Text style={styles.profileAvatarInitials}>{initials}</Text>}
        </View>
        <Pressable onPress={chooseAvatar} disabled={isAvatarUploading} style={styles.profileAvatarChange}>
          <Text style={styles.profileAvatarChangeText}>{isAvatarUploading ? 'Đang tải ảnh lên…' : 'Đổi ảnh đại diện'}</Text>
        </Pressable>
        <Text style={styles.profileSummaryName}>{displayName}</Text>
        <Text style={styles.profileSummaryEmail}>{user.email}</Text>
        <View style={styles.profileSummaryBadge}><Text style={styles.profileSummaryBadgeText}>Thành viên cộng đồng</Text></View>
      </View>
      <View style={styles.profileStatsRow}>
        <View style={styles.profileStat}><Text style={styles.profileStatValue}>{favorites.length}</Text><Text style={styles.profileStatLabel}>Yêu thích</Text></View>
        <View style={styles.profileStat}><Text style={styles.profileStatValue}>{history.length}</Text><Text style={styles.profileStatLabel}>Tra cứu</Text></View>
        <View style={styles.profileStat}><Text style={styles.profileStatValue}>{contributions.length}</Text><Text style={styles.profileStatLabel}>Đóng góp</Text></View>
      </View>
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
            <TextInput value={user.email || ''} editable={false} style={[styles.formInput, styles.disabledInput]} />
            <Pressable onPress={save} disabled={isAvatarUploading} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Lưu thay đổi</Text></Pressable>
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
            {history.length ? history.map((item) => <View style={styles.listItem} key={item.id}><View style={styles.listItemContent}><Text style={styles.listTitle}>{item.search_query}</Text></View><Pressable style={styles.deleteButton} onPress={() => deleteSearchHistoryItem(item.id).then(() => setHistory((items) => items.filter((entry) => entry.id !== item.id)))}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>) : <Text style={styles.emptyText}>Chưa có lịch sử tra cứu.</Text>}
          </View>
        ) : null}
        {tab === 'contributions' ? (
          <View>
            <Text style={styles.cardTitle}>Đóng góp từ vựng</Text>
            {contributionFields.map(({ key, placeholder }) => <TextInput key={key} value={form[key]} onChangeText={(value) => setForm({ ...form, [key]: value })} placeholder={placeholder} style={styles.formInput} />)}
            <Pressable onPress={contribute} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Gửi để kiểm duyệt</Text></Pressable>
            {contributions.map((item) => <View style={styles.listItem} key={item.id}><View style={styles.listItemContent}><Text style={styles.listTitle}>{item.word}</Text><Text style={styles.listDescription}>{item.definition} · {item.status}</Text></View><Pressable style={styles.deleteButton} onPress={() => deleteContribution(item.id).then(() => setContributions((items) => items.filter((entry) => entry.id !== item.id)))}><Text style={styles.deleteText}>Xóa</Text></Pressable></View>)}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
export default React.memo(ProfileScreen);
