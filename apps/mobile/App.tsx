import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import LogoutToast from './components/LogoutToast';
import ProfileScreen from './components/ProfileScreen';
import NotebookScreen from './components/NotebookScreen';
import CultureScreen from './components/CultureScreen';
import { useAuthSession } from './hooks/useAuthSession';
import { getAccount } from './services/profileService';
import { COLORS, styles } from './theme';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

type AppScreen = 'home' | 'notebook' | 'culture' | 'profile';

export default function App() {
  const { user, isInitializing, logout, showLogoutToast, dismissLogoutToast } = useAuthSession();
  const [screen, setScreen] = useState<AppScreen>('home');
  const [authVisible, setAuthVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setAvatarUrl(null);
      return () => { active = false; };
    }

    getAccount()
      .then((account) => { if (active) setAvatarUrl(account.avatar_url || null); })
      .catch(() => { if (active) setAvatarUrl(null); });
    return () => { active = false; };
  }, [user?.id]);

  const handleLogout = async () => {
    const succeeded = await logout();
    if (succeeded) setScreen('home');
  };
  const activeNavIndex = screen === 'notebook' ? 1 : screen === 'culture' ? 2 : screen === 'profile' ? 3 : 0;

  if (isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang khôi phục phiên...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <Header user={user} avatarUrl={avatarUrl} onProfile={() => setScreen('profile')} onLogin={() => setAuthVisible(true)} onLogout={handleLogout} />
        {screen === 'home' ? (
          <HomeScreen user={user} onLogin={() => setAuthVisible(true)} />
        ) : screen === 'notebook' ? (
          user ? <NotebookScreen userId={user.id} /> : <HomeScreen user={user} onLogin={() => setAuthVisible(true)} />
        ) : screen === 'culture' ? (
          <CultureScreen />
        ) : user ? (
          <ProfileScreen user={user} onBack={() => setScreen('home')} onAvatarChanged={setAvatarUrl} />
        ) : <HomeScreen user={user} onLogin={() => setAuthVisible(true)} />}
        <View style={styles.bottomNav}>
          {[
            ['⌂', 'Trang chủ'],
            ['☆', 'Sổ tay'],
            ['▤', 'Văn hoá'],
            ['◎', 'Cá nhân'],
          ].map(([icon, label], index) => (
            <Pressable
              key={label}
              style={[styles.navItem, index === activeNavIndex && styles.navItemSelected]}
              onPress={() => {
                if (index === 0) setScreen('home');
                if (index === 1) { if (user) setScreen('notebook'); else setAuthVisible(true); }
                if (index === 2) setScreen('culture');
                if (index === 3 && user) setScreen('profile'); else if (index === 3) setAuthVisible(true);
              }}
              accessibilityRole="button"
            >
              <Text style={[styles.navIcon, index === activeNavIndex && styles.navItemActive]}>{icon}</Text>
              <Text style={[styles.navLabel, index === activeNavIndex && styles.navLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
        <LogoutToast visible={showLogoutToast} onDismiss={dismissLogoutToast} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
