// src/components/LoginModal.jsx
import React, { useState } from 'react';

const LoginModal = ({ show, onClose }) => {
  // 1. Khai báo các State quản lý form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2. Nếu state show = false thì ẩn modal (không render gì cả)
  if (!show) return null;

  // 3. Hàm xử lý khi bấm nút "Sign In"
  const handleLoginSubmit = (e) => {
    e.preventDefault(); // Ngăn trang web load lại
    console.log("Tài khoản:", username, "Mật khẩu:", password);
    alert(`Đang xử lý đăng nhập cho: ${username}`);
    // onClose(); // Mở comment này nếu muốn tự động đóng Modal sau khi bấm
  };

  // 4. Hàm bật/tắt hiển thị mật khẩu
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 5. Giao diện Modal
  return (
    <div className="modal fade login10-modal show d-block" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content login10-card">
          
          {/* Nút đóng Modal */}
          <button type="button" className="btn-close login10-close position-absolute top-0 end-0 m-3" onClick={onClose} aria-label="Close"></button>

          <div className="login10-body p-4">
            <h3 className="mb-4 text-center">Have an account?</h3>

            <form onSubmit={handleLoginSubmit} className="signin-form">
              <div className="mb-3">
                <input 
                  type="text" 
                  className="form-control login10-control" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-3 login10-password-wrap position-relative">
                <input 
                  id="login10-password" 
                  type={showPassword ? "text" : "password"} 
                  className="form-control login10-control" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  className="login10-toggle btn border-0 position-absolute top-50 end-0 translate-middle-y me-2" 
                  type="button" 
                  aria-label="Toggle password"
                  onClick={togglePasswordVisibility}
                >
                  <span className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></span>
                </button>
              </div>

              <div className="mb-3">
                <button type="submit" className="btn btn-primary w-100 login10-submit py-2">
                  Sign In
                </button>
              </div>

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

// Xuất (Export) Component để các file khác có thể dùng được
export default LoginModal;