import { memo } from 'react';
import './Header.css';

function Header({ onOpenLogin, currentUser, isAuthInitializing, onLogout }) {
  return (
    <header className="header">
      <div className="logo"><a href="#home">Từ điển S'tiêng</a></div>
      <nav className="nav-links" aria-label="Điều hướng chính">
        <a href="#home">Trang chủ</a>
        <a href="#features">Từ điển</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      <div className="header-account">
        {isAuthInitializing ? (
          <span className="header-user" aria-live="polite">Đang khôi phục phiên...</span>
        ) : currentUser ? (
          <>
            <span className="header-user">Xin chào, {currentUser.full_name || currentUser.user_metadata?.full_name || currentUser.email || currentUser.name || currentUser.username}</span>
            <button type="button" className="header-action" onClick={onLogout}>Đăng xuất</button>
          </>
        ) : (
          <button type="button" className="header-action" onClick={onOpenLogin}>Đăng nhập</button>
        )}
      </div>
    </header>
  );
}

export default memo(Header);
