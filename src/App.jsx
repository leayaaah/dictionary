// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import Words from './components/Words';
import WordOfTheDay from './components/WordOfTheDay';
import LoginModal from './components/LoginModal'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './components/LoginModal.css'; 

// 1. Cập nhật Header: Nhận thêm currentUser và hàm onLogout
const Header = ({ onOpenLogin, currentUser, onLogout }) => {
  return (
    <header className="header">
      <div className="logo">MyDictionary</div>
      <nav className="nav-links">
        <a href="#home">Trang chủ</a>
        <a href="#features">Tính năng</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      
      {/* 2. Hiển thị theo trạng thái đăng nhập */}
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {currentUser ? (
          // NẾU ĐÃ ĐĂNG NHẬP: Hiện tên và nút Đăng xuất
          <>
            <span style={{ fontSize: '16px', fontWeight: 'normal' }}>
              <h2>{currentUser.username}</h2>
            </span>
            <a 
              href="#logout" 
              onClick={(e) => {
                e.preventDefault(); 
                onLogout(); 
              }}
              style={{ color: '#ff4d4f' }} // Cho nút đăng xuất màu đỏ xíu cho đẹp
            >
              Đăng xuất
            </a>
          </>
        ) : (
          // NẾU CHƯA ĐĂNG NHẬP: Hiện nút Đăng nhập như cũ
          <a 
            href="#login" 
            onClick={(e) => {
              e.preventDefault(); 
              onOpenLogin();      
            }}
          >
            Đăng nhập
          </a>
        )}
      </div>
    </header>
  );
};

// ... (Component SearchSection của bạn giữ nguyên ở đây) ...
const SearchSection = ({ onSearch, onClear }) => {
  const [keyword, setKeyword] = useState('');
  const handleSearch = (e) => { e.preventDefault(); if (keyword.trim() !== '') onSearch(keyword.trim()); };
  const handleClear = () => { setKeyword(''); onClear(); };

  return (
    <section className="search-section">
      <h1>Chào mừng bạn đến với Từ điển trực tuyến S'tiêng</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input type="text" className="search-input" placeholder="Bạn muốn tra từ gì?" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button type="submit" className="search-button">Tra Cứu</button>
        {keyword && <button type="button" className="clear-button" onClick={handleClear}>Xóa</button>}
      </form>
    </section>
  );
};

// 3. Component App Chính
function App() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // STATE MỚI: Khởi tạo currentUser từ Local Storage (nếu có)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('dictionary_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // HÀM MỚI: Xử lý khi đăng nhập thành công
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData); // Lưu vào State để đổi giao diện ngay
    // Lưu vào Local Storage để F5 không bị mất
    localStorage.setItem('dictionary_user', JSON.stringify(userData)); 
  };

  // HÀM MỚI: Xử lý khi bấm Đăng xuất
  const handleLogout = () => {
    setCurrentUser(null); // Xóa khỏi State
    localStorage.removeItem('dictionary_user'); // Xóa khỏi Local Storage
    alert("Bạn đã đăng xuất thành công!");
  };

  const handleSearchWord = (word) => setSearchKeyword(word);
  const handleClearSearch = () => setSearchKeyword('');

  return (
    <div>
      <section id="home" className="hero">
        <div className="overlay"></div>
        <div className="hero-content">
          {/* Truyền currentUser và onLogout vào Header */}
          <Header 
            onOpenLogin={() => setShowLoginModal(true)} 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <SearchSection onSearch={handleSearchWord} onClear={handleClearSearch} />
        </div>
      </section>

      <section id="features" style={{ padding: '40px 20px' }}>
        {!searchKeyword && <WordOfTheDay />}
        <Words searchKeyword={searchKeyword} />
      </section>

      <section id="about" style={{ padding: '60px 20px', backgroundColor: '#f9f9f9', textAlign: 'center' }}>
        <h2>Về chúng tôi</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: '#555' }}>
          Dự án từ điển trực tuyến nhằm bảo tồn và phát triển tiếng S'tiêng.
        </p>
      </section>

      {/* Truyền hàm handleLoginSuccess vào LoginModal */}
      <LoginModal 
        show={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLoginSuccess={handleLoginSuccess}
      />

      <footer className="footer text-center py-3 bg-dark text-white">
        <p className="mb-0">&copy; 2026 THUYLY - A 20 years old person.</p>
      </footer>
    </div>
  );
}

export default App;