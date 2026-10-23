import { useState } from 'react';
import { signUp } from '../services/authService';

function RegisterForm({ onShowLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const data = await signUp({ fullName: fullName.trim(), email: email.trim(), password });
      setSuccessMessage(data.session
        ? 'Đăng ký thành công. Bạn có thể đăng nhập ngay.'
        : 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.');
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Không thể đăng ký:', error);
      setErrorMessage(error.message || 'Không thể đăng ký. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="login10-heading">
        <span className="login10-mark" aria-hidden="true">⌁</span>
        <p className="login10-eyebrow">TỪ ĐIỂN S'TIÊNG</p>
        <h2 id="login-modal-title">Tạo tài khoản</h2>
        <p className="login10-subtitle">Lưu lại những từ ngữ và đóng góp cho cộng đồng.</p>
      </div>
      <form onSubmit={handleSubmit} className="signin-form">
        <div className="login10-field"><label htmlFor="register-name">Họ và tên</label><input id="register-name" className="login10-control" type="text" placeholder="Nhập họ và tên" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required disabled={isLoading} /></div>
        <div className="login10-field"><label htmlFor="register-email">Email</label><input id="register-email" className="login10-control" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} /></div>
        <div className="login10-field"><label htmlFor="register-password">Mật khẩu</label><input id="register-password" className="login10-control" type="password" placeholder="Ít nhất 6 ký tự" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} /></div>
        {errorMessage && <div className="login10-message login10-error" role="alert">{errorMessage}</div>}
        {successMessage && <div className="login10-message login10-success" role="status">{successMessage}</div>}
        <button type="submit" className="login10-submit" disabled={isLoading}>{isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</button>
      </form>
      <div className="login10-footer">
        <span>Đã có tài khoản?</span>
        <button type="button" className="login10-link" onClick={onShowLogin}>Đăng nhập</button>
      </div>
    </>
  );
}

export default RegisterForm;
