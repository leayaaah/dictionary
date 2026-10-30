import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../theme';

interface LogoutToastProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function LogoutToast({ visible, onDismiss }: LogoutToastProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return undefined;
    const timeout = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timeout);
  }, [visible, onDismiss]);

  if (!visible) return null;
  return (
    <Pressable style={[styles.toast, { top: insets.top + 12 }]} onPress={onDismiss} accessibilityRole="alert">
      <Text style={styles.toastText}>Bạn đã đăng xuất thành công.</Text>
    </Pressable>
  );
}
