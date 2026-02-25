// src/App.jsx
import React, { useState } from 'react';
import './App.css';
import Words from './components/Words';
import WordOfTheDay from './components/WordOfTheDay';

// MỚI: Nhập Component LoginModal vừa tách ra
import LoginModal from './components/LoginModal'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './components/LoginModal.css'

// 1. Component Header
const Header = ({ onOpenLogin }) => {
  return (
    <header className="header">
      <div className="logo">MyDictionary</div>
      <nav className="nav-links">
        <a href="#home">Trang chủ</a>
        <a href="#features">Tính năng</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      <div className="logo">
        <a 
          href="#login" 
          onClick={(e) => {
            e.preventDefault(); 
            onOpenLogin();      
          }}
        >
          Đăng nhập
        </a>
      </div>
    </header>
  );
};

// 2. Component SearchSection
const SearchSection = ({ onSearch, onClear }) => {
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault(); 
    if (keyword.trim() !== '') {
      onSearch(keyword.trim());
    }
  };

  const handleClear = () => {
    setKeyword('');
    onClear();
  };

  return (
    <section className="search-section">
      <h1>Chào mừng bạn đến với Từ điển trực tuyến S'tiêng</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input 
          type="text" 
          className="search-input"
          placeholder="Bạn muốn tra từ gì?" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit" className="search-button">Tra Cứu</button>
        {keyword && (
          <button type="button" className="clear-button" onClick={handleClear}>Xóa</button>
        )}
      </form>
    </section>
  );
};

// 3. Component App Chính
function App() {
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // State quản lý đóng/mở Modal vẫn phải nằm ở App 
  // để truyền xuống Header (nút mở) và LoginModal (nội dung)
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSearchWord = (word) => setSearchKeyword(word);
  const handleClearSearch = () => setSearchKeyword('');

  return (
    <div>
      <section id="home" className="hero">
        <div className="overlay"></div>
        <div className="hero-content">
          <Header onOpenLogin={() => setShowLoginModal(true)} />
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

      {/* Gọi Component LoginModal ở đây */}
      <LoginModal 
        show={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      <footer className="footer text-center py-3 bg-dark text-white">
        <p className="mb-0">&copy; 2026 THUYLY - A 20 years old person.</p>
      </footer>
    </div>
  );
}

export default App;