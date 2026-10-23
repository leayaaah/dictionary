import { useEffect, useRef, useState } from 'react';
import { signIn } from '../services/authService';
import RegisterForm from './RegisterForm';

import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginModal.css';

function LoginModal({ show, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (!show) return undefined;

    emailInputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, isLoading, onClose]);

  if (!show) return null;

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const account = await signIn(normalizedEmail, password);
      if (!account) {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác.');
        return;
      }

      onLoginSuccess(account);
      setEmail('');
      setPassword('');
      onClose();
    } catch (error) {
      console.error('Không thể đăng nhập:', error);
      setErrorMessage('Không thể kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setErrorMessage('');
    setIsRegistering(false);
    onClose();
  };

  return (
    <div className="login10-modal" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onMouseDown={(event) => event.target === event.currentTarget && handleClose()}>
      <div className="login10-dialog">
        <div className="modal-content login10-card">
          <button type="button" className="login10-close" onClick={handleClose} aria-label="Đóng" disabled={isLoading}>×</button>
          <div className="login10-body">
            {isRegistering ? (
              <RegisterForm onShowLogin={() => setIsRegistering(false)} />
            ) : (
              <>
                <div className="login10-heading">
                  <span className="login10-mark" aria-hidden="true">⌁</span>
                  <p className="login10-eyebrow">TỪ ĐIỂN S'TIÊNG</p>
                  <h2 id="login-modal-title">Chào mừng trở lại</h2>
                  <p className="login10-subtitle">Đăng nhập để tiếp tục hành trình khám phá ngôn ngữ.</p>
                </div>
                <form onSubmit={handleLoginSubmit} className="signin-form">
                  <div className="login10-field">
                    <label htmlFor="login10-email">Email</label>
                    <input ref={emailInputRef} id="login10-email" type="email" className="login10-control" placeholder="Nhập email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} />
                  </div>
                  <div className="login10-field login10-password-wrap">
                    <label htmlFor="login10-password">Mật khẩu</label>
                    <input id="login10-password" type={showPassword ? 'text' : 'password'} className="login10-control" placeholder="Nhập mật khẩu" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} />
                    <button className="login10-toggle" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} disabled={isLoading}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  {errorMessage && <div className="login10-message login10-error" role="alert">{errorMessage}</div>}
                  <button type="submit" className="login10-submit" disabled={isLoading}>{isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</button>
                </form>
                <div className="login10-footer">
                  <span>Chưa có tài khoản?</span>
                  <button type="button" className="login10-link" onClick={() => { setErrorMessage(''); setIsRegistering(true); }}>Đăng ký ngay</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
