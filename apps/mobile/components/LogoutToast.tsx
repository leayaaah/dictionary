import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '../theme';

interface LogoutToastProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function LogoutToast({ visible, onDismiss }: LogoutToastProps) {
  useEffect(() => {
    if (!visible) return undefined;
    const timeout = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timeout);
  }, [visible, onDismiss]);

  if (!visible) return null;
  return (
    <Pressable style={styles.toast} onPress={onDismiss} accessibilityRole="alert">
      <Text style={styles.toastText}>Bạn đã đăng xuất thành công.</Text>
    </Pressable>
  );
}
