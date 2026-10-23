// src/components/LoginModal.jsx
import React, { useState } from 'react';
import { login } from '../services/authService'; 

const LoginModal = ({ show, onClose, onLoginSuccess }) => {
  // Các state quản lý form và trạng thái
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  // Nếu show = false thì không hiển thị Modal
  if (!show) return null;

  // Hàm xử lý khi người dùng bấm nút Đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); 
    setErrorMessage(''); // Xóa thông báo lỗi cũ
    setIsLoading(true);  // Bật trạng thái đang tải

    try {
      const data = await login(username, password);
      if (!data) {
        // Sai tài khoản hoặc mật khẩu
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác!');
      } else {
        // Đăng nhập thành công
        alert(`Đăng nhập thành công! Xin chào ${data.username}`);
        
        // Gửi thông tin user về App.jsx để lưu trạng thái
        onLoginSuccess(data); 
        
        // Đóng modal đăng nhập
        onClose(); 
        
        // Xóa trống form cho những lần sau
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      console.error("Lỗi mạng hoặc hệ thống:", err);
      setErrorMessage('Đã xảy ra lỗi kết nối, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false); // Tắt trạng thái tải
    }
  };

  // Hàm ẩn/hiện mật khẩu khi bấm vào icon con mắt
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="modal fade login10-modal show d-block" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content login10-card">
          
          {/* Nút đóng Modal ở góc trên bên phải */}
          <button type="button" className="btn-close login10-close position-absolute top-0 end-0 m-3" onClick={onClose} aria-label="Close"></button>

          <div className="login10-body p-4">
            <h3 className="mb-4 text-center">Have an account?</h3>

            <form onSubmit={handleLoginSubmit} className="signin-form">
              {/* Ô nhập Tài khoản */}
              <div className="mb-3">
                <input 
                  type="text" 
                  className="form-control login10-control" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  disabled={isLoading} // Khóa ô nhập khi đang tải
                />
              </div>

              {/* Ô nhập Mật khẩu */}
              <div className="mb-3 login10-password-wrap position-relative">
                <input 
                  id="login10-password" 
                  type={showPassword ? "text" : "password"} 
                  className="form-control login10-control" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={isLoading}
                />
                {/* Nút bấm ẩn/hiện mật khẩu */}
                <button 
                  className="login10-toggle btn border-0 position-absolute top-50 end-0 translate-middle-y me-2" 
                  type="button" 
                  aria-label="Toggle password"
                  onClick={togglePasswordVisibility}
                >
                  <span className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></span>
                </button>
              </div>

              {/* Khu vực hiển thị chữ báo lỗi màu đỏ */}
              {errorMessage && (
                <div className="text-danger text-center mb-3" style={{ fontSize: '14px', fontWeight: '500' }}>
                  {errorMessage}
                </div>
              )}

              {/* Nút Đăng Nhập */}
              <div className="mb-3">
                <button type="submit" className="btn btn-primary w-100 login10-submit py-2" disabled={isLoading}>
                  {isLoading ? 'Đang kiểm tra...' : 'Sign In'}
                </button>
              </div>

              {/* Các tùy chọn nhớ mật khẩu và quên mật khẩu */}
              <div className="d-flex align-items-center mb-4">
                <div className="flex-grow-1">
                  <label className="login10-remember">
                    <input className="form-check-input me-2" type="checkbox" defaultChecked />
                    Remember Me
                  </label>
                </div>
                <div className="text-end">
                  <a href="#forgot" className="login10-link text-decoration-none">Forgot Password</a>
                </div>
              </div>
            </form>

            {/* Khu vực đăng nhập bằng mạng xã hội (tùy chọn thêm) */}
            <p className="w-100 text-center login10-divider text-muted mb-3">&mdash; Or Sign In With &mdash;</p>

            <div className="d-flex gap-2 text-center">
              <a href="#facebook" className="login10-social btn btn-outline-primary rounded py-2 px-2 flex-fill">
                <span className="fa fa-facebook me-2"></span> Facebook
              </a>
              <a href="#twitter" className="login10-social btn btn-outline-info rounded py-2 px-2 flex-fill">
                <span className="fa fa-twitter me-2"></span> Twitter
              </a>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;