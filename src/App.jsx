import React, { useState } from 'react';
import './App.css';
import Words from './components/Words';
import WordOfTheDay from './components/WordOfTheDay';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">MyDictionary</div>
      <nav className="nav-links">
        <a href="#home">Trang chủ</a>
        <a href="#features">Tính năng</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
    </header>
  );
};

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
    onClear(); // Gọi hàm xóa kết quả tìm kiếm ở App
  };

  return (
    <section className="search-section">
      <h1>Khám phá ngôn ngữ của bạn</h1>
      <p>Nhập một từ để tra cứu định nghĩa, từ đồng nghĩa và cách phát âm.</p>
      
      <form onSubmit={handleSearch} className="search-form">
        <input 
          type="text" 
          className="search-input"
          placeholder="Bạn muốn tra từ gì? (Anh hoặc Việt)..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit" className="search-button">Tra Cứu</button>
        {keyword && (
          <button type="button" className="clear-button" onClick={handleClear} >
            Xóa
          </button>
        )}
      </form>
    </section>
  );
};

function App() {
  // State lưu trữ từ khóa người dùng đang tìm
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearchWord = (word) => {
    setSearchKeyword(word); // Lưu từ khóa vào state
  };

  const handleClearSearch = () => {
    setSearchKeyword(''); // Reset từ khóa về rỗng
  };

  return (
    <div className="app-container">
      <Header />
      <main>
        {/* Truyền hàm xử lý tìm kiếm và xóa vào SearchSection */}
        <SearchSection onSearch={handleSearchWord} onClear={handleClearSearch} />
        
        {/* Chỉ hiển thị Từ của ngày nếu KHÔNG CÓ từ khóa tìm kiếm */}
        {!searchKeyword && <WordOfTheDay />}
        
        {/* Truyền từ khóa xuống component Words để lọc dữ liệu */}
        <Words searchKeyword={searchKeyword} />
      </main>
      <footer className="footer">
        <p>&copy; 2026 MyDictionary. Bản quyền thuộc về bạn.</p>
      </footer>
    </div>
  );
}

export default App;