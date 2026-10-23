import React from 'react';

function Header({ onOpenLogin, currentUser, onLogout }) {
  return (
    <header className="header">
      <div className="logo"><a href="#home">Từ điển S'tiêng</a></div>
      <nav className="nav-links" aria-label="Điều hướng chính">
        <a href="#home">Trang chủ</a>
        <a href="#features">Từ điển</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      <div className="header-account">
        {currentUser ? (
          <>
            <span className="header-user">Xin chào, {currentUser.name || currentUser.email}</span>
            <button type="button" className="header-action" onClick={onLogout}>Đăng xuất</button>
          </>
        ) : (
          <button type="button" className="header-action" onClick={onOpenLogin}>Đăng nhập</button>
        )}
      </div>
    </header>
  );
}

export default Header;
