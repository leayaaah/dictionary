import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import LogoutToast from './components/LogoutToast';
import ProfileScreen from './components/ProfileScreen';
import { useAuthSession } from './hooks/useAuthSession';
import { COLORS, styles } from './theme';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

type AppScreen = 'home' | 'profile';

export default function App() {
  const { user, isInitializing, logout, showLogoutToast, dismissLogoutToast } = useAuthSession();
  const [screen, setScreen] = useState<AppScreen>('home');
  const [authVisible, setAuthVisible] = useState(false);

  const handleLogout = async () => {
    const succeeded = await logout();
    if (succeeded) setScreen('home');
  };

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
        <Header user={user} onProfile={() => setScreen('profile')} onLogin={() => setAuthVisible(true)} onLogout={handleLogout} />
        {screen === 'home' || !user ? (
          <HomeScreen user={user} onLogin={() => setAuthVisible(true)} />
        ) : (
          <ProfileScreen user={user} onBack={() => setScreen('home')} onLogout={handleLogout} />
        )}
        <View style={styles.bottomNav}>
          {[
            ['⌂', 'Trang chủ'],
            ['⌕', 'Tra từ'],
            ['☆', 'Sổ tay'],
            ['▤', 'Văn hoá'],
            ['◎', 'Cá nhân'],
          ].map(([icon, label], index) => (
            <Pressable
              key={label}
              style={styles.navItem}
              onPress={() => { if (index === 4 && user) setScreen('profile'); else if (index === 4) setAuthVisible(true); }}
              accessibilityRole="button"
            >
              <Text style={[styles.navIcon, index === 0 && styles.navItemActive]}>{icon}</Text>
              <Text style={[styles.navLabel, index === 0 && styles.navLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
        <LogoutToast visible={showLogoutToast} onDismiss={dismissLogoutToast} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
