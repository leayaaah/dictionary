import React, { useState } from 'react';
import './App.css';
import Words from './components/Words';
import WordOfTheDay from './components/WordOfTheDay';
import 'bootstrap/dist/css/bootstrap.min.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">MyDictionary</div>
      <nav className="nav-links">
        <a href="#home">Trang chủ</a>
        <a href="#features">Tính năng</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      <div className="logo">
        <a href="#login">Đăng nhập</a>
      </div>
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
      <h1>Chào mừng bạn đến với Từ điển trực tuyến S'tiêng</h1>
      {/* <p>Nhập một từ để tra cứu định nghĩa, từ đồng nghĩa và cách phát âm.</p> */}
      
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
          <button type="button" className="clear-button" onClick={handleClear} >
            Xóa
          </button>
        )}
      </form>

    </section>
  );
};

function App() {
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearchWord = (word) => {
    setSearchKeyword(word); 
  };

  const handleClearSearch = () => {
    setSearchKeyword(''); 
  };

  return (
    <div>
      <section className="hero">
        <div className="overlay"></div>

        <div className="hero-content">
          <Header />
          <SearchSection 
            onSearch={handleSearchWord} 
            onClear={handleClearSearch} 
          />

        </div>
        
      </section>

      {!searchKeyword && <WordOfTheDay />}
      <Words searchKeyword={searchKeyword} />

      <footer className="footer">
        <p>&copy; 2026 THUYLY - A 20 years old person.</p>
      </footer>
    </div>
  );
}

export default App;