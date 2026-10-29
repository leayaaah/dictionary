import { Image, Pressable, Text, View } from 'react-native';
import type { AuthUser } from '../types';
import { styles } from '../theme';

interface HeaderProps {
  user: AuthUser | null;
  avatarUrl: string | null;
  onProfile: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({ user, avatarUrl, onProfile, onLogin, onLogout }: HeaderProps) {
  const fullName = user?.user_metadata?.full_name;
  const displayName = typeof fullName === 'string' && fullName ? fullName : user?.email;

  return (
    <View style={styles.header}>
      <View>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>S&apos;TIÊNG</Text>
        </View>
        <Text style={styles.brandSub}>TỪ ĐIỂN TRỰC TUYẾN</Text>
      </View>
      {user ? (
        <View style={styles.headerActions}>
          <Pressable onPress={onProfile} style={styles.avatar} accessibilityLabel={`Hồ sơ ${displayName || ''}`}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(displayName || 'U')[0].toUpperCase()}</Text>
            )}
          </Pressable>
          <Pressable onPress={onLogout}><Text style={styles.headerLink}>Đăng xuất</Text></Pressable>
        </View>
      ) : (
        <Pressable onPress={onLogin}><Text style={styles.headerLink}>Đăng nhập</Text></Pressable>
      )}
    </View>
  );
}
