import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { signIn, signUp } from '../services/authService';
import { styles } from '../theme';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
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
        const result = await signUp({ fullName, email, password });
        if (result.session) {
          onClose();
        } else {
          Alert.alert('Đăng ký thành công', 'Hãy kiểm tra email để xác nhận tài khoản.');
          setRegistering(false);
        }
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể thực hiện. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.authCard}>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Đóng">
            <Text style={styles.closeText}>×</Text>
          </Pressable>
          <Text style={styles.eyebrow}>TỪ ĐIỂN S&apos;TIÊNG</Text>
          <Text style={styles.modalTitle}>{registering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</Text>
          <Text style={styles.modalSubtitle}>{registering ? 'Cùng đóng góp và khám phá ngôn ngữ.' : 'Đăng nhập để lưu những từ bạn yêu thích.'}</Text>
          {registering ? <TextInput value={fullName} onChangeText={setFullName} autoCapitalize="words" placeholder="Họ và tên" style={styles.formInput} /> : null}
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Email" style={styles.formInput} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete={registering ? 'new-password' : 'current-password'} placeholder="Mật khẩu" style={styles.formInput} />
          {error ? <Text style={styles.errorText} accessibilityRole="alert">{error}</Text> : null}
          <Pressable disabled={busy} onPress={submit} style={styles.primaryButton}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{registering ? 'Đăng ký' : 'Đăng nhập'}</Text>}
          </Pressable>
          <Pressable disabled={busy} onPress={() => { setError(''); setRegistering((value) => !value); }} style={styles.switchAuth}>
            <Text style={styles.switchAuthText}>{registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
