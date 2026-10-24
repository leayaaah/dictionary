import { memo } from 'react';
import './Header.css';

function Header({ onOpenLogin, currentUser, isAuthInitializing, onLogout }) {
  return (
    <header className="header">
      <div className="logo">
        <a href="#home">
          <span>Từ điển S'tiêng</span>
          <small>Di sản ngôn ngữ Tây Nguyên &amp; Bình Phước</small>
        </a>
      </div>
      <nav className="nav-links" aria-label="Điều hướng chính">
        <a className="active" href="#home">Trang chủ</a>
        <a href="#features">Từ điển</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      <div className="header-account">
        {isAuthInitializing ? (
          <span className="header-user" aria-live="polite">Đang khôi phục phiên...</span>
        ) : currentUser ? (
          <>
            <a className="header-user header-profile-link" href="/profile">
              <span className="user-greeting">Xin chào,</span>{' '}
              {currentUser.full_name || currentUser.user_metadata?.full_name || currentUser.email || currentUser.name || currentUser.username}
            </a>
            <button type="button" className="header-action" onClick={onLogout}>↪ <span>Đăng xuất</span></button>
          </>
        ) : (
          <button type="button" className="header-action" onClick={onOpenLogin}>Đăng nhập</button>
        )}
      </div>
    </header>
  );
}

export default memo(Header);
