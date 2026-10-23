import { useState } from 'react';
import { login } from '../services/authService';
import RegisterForm from './RegisterForm';

import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginModal.css';

function LoginModal({ show, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  if (!show) return null;

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const account = await login(username.trim(), password);
      if (!account) {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác.');
        return;
      }

      onLoginSuccess(account);
      setUsername('');
      setPassword('');
      onClose();
    } catch (error) {
      console.error('Không thể đăng nhập:', error);
      setErrorMessage('Không thể kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal fade login10-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content login10-card">
          <button type="button" className="btn-close login10-close position-absolute top-0 end-0 m-3" onClick={onClose} aria-label="Đóng" />
          <div className="login10-body p-4">
            {isRegistering ? (
              <RegisterForm onShowLogin={() => setIsRegistering(false)} onClose={onClose} />
            ) : (
              <>
                <h3 id="login-modal-title" className="mb-4 text-center">Đăng nhập</h3>
                <form onSubmit={handleLoginSubmit} className="signin-form">
                  <div className="mb-3">
                    <input type="text" className="form-control login10-control" placeholder="Tên đăng nhập" aria-label="Tên đăng nhập" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required disabled={isLoading} />
                  </div>
                  <div className="mb-3 login10-password-wrap position-relative">
                    <input id="login10-password" type={showPassword ? 'text' : 'password'} className="form-control login10-control" placeholder="Mật khẩu" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} />
                    <button className="login10-toggle btn border-0 position-absolute top-50 end-0 translate-middle-y me-2" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                      <span className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  {errorMessage && <div className="text-danger text-center mb-3" role="alert">{errorMessage}</div>}
                  <button type="submit" className="btn btn-primary w-100 login10-submit py-2 mb-3" disabled={isLoading}>{isLoading ? 'Đang kiểm tra...' : 'Đăng nhập'}</button>
                </form>
                <div className="text-center">
                  <button type="button" className="btn btn-link login10-link" onClick={() => setIsRegistering(true)}>Chưa có tài khoản? Đăng ký</button>
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
