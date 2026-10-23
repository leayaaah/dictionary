import { useState } from 'react';
import { signUp } from '../services/authService';

function RegisterForm({ onShowLogin, onClose }) {
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
      <h3 id="login-modal-title" className="mb-4 text-center">Đăng ký</h3>
      <form onSubmit={handleSubmit} className="signin-form">
        <div className="mb-3"><input className="form-control login10-control" type="text" placeholder="Họ và tên" aria-label="Họ và tên" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required disabled={isLoading} /></div>
        <div className="mb-3"><input className="form-control login10-control" type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} /></div>
        <div className="mb-3"><input className="form-control login10-control" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" aria-label="Mật khẩu" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} /></div>
        {errorMessage && <div className="text-danger text-center mb-3" role="alert">{errorMessage}</div>}
        {successMessage && <div className="text-success text-center mb-3" role="status">{successMessage}</div>}
        <button type="submit" className="btn btn-primary w-100 login10-submit py-2 mb-3" disabled={isLoading}>{isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</button>
      </form>
      <div className="text-center">
        <button type="button" className="btn btn-link login10-link" onClick={onShowLogin}>Đã có tài khoản? Đăng nhập</button>
        <button type="button" className="btn btn-link login10-link" onClick={onClose}>Đóng</button>
      </div>
    </>
  );
}

export default RegisterForm;
