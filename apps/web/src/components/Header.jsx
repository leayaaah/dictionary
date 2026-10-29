import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

function Header({ onOpenLogin, currentUser, isAuthInitializing, onLogout }) {
  const { pathname } = useLocation();
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <span>Từ điển S'tiêng</span>
          <small>Di sản ngôn ngữ Tây Nguyên &amp; Bình Phước</small>
        </Link>
      </div>
      <nav className="nav-links" aria-label="Điều hướng chính">
        <Link className={pathname === '/' ? 'active' : ''} to="/">Trang chủ</Link>
        <Link to="/#about">Về chúng tôi</Link>
        <Link className={pathname === '/notebook' ? 'active' : ''} to="/notebook">Sổ tay</Link>
        <Link className={pathname === '/culture' ? 'active' : ''} to="/culture">Văn hóa</Link>
      </nav>
      <div className="header-account">
        {isAuthInitializing ? (
          <span className="header-user" aria-live="polite">Đang khôi phục phiên...</span>
        ) : currentUser ? (
          <>
            <Link className="header-user header-profile-link" to="/profile">
              <span className="user-greeting">Xin chào,</span>{' '}
              {currentUser.full_name || currentUser.user_metadata?.full_name || currentUser.email || currentUser.name || currentUser.username}
            </Link>
            {currentUser.app_metadata?.role === 'admin' && (
              <Link className="header-admin-link" to="/admin/contributions">Quản trị đóng góp</Link>
            )}
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
