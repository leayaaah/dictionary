import React, { useState } from 'react';
// import './App.css';

// 1. Component Thanh điều hướng
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

// 2. Component Thanh tìm kiếm chính
const SearchSection = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault(); // Ngăn trang tải lại khi submit form
    onSearch(keyword);
  };

  return (
    <section className="search-section">
      <h1>Khám phá ngôn ngữ của bạn</h1>
      <p>Nhập một từ để tra cứu định nghĩa, từ đồng nghĩa và cách phát âm.</p>
      
      <form onSubmit={handleSearch} className="search-form">
        <input 
          type="text" 
          className="search-input"
          placeholder="Bạn muốn tra từ gì?..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit" className="search-button">Tra Cứu</button>
      </form>
    </section>
  );
};

// 3. Component Từ của ngày (Placeholder nội dung)
const WordOfTheDay = () => {
  return (
    <section className="word-of-day">
      <h2>Từ của ngày</h2>
      <div className="word-card">
        <h3>Luminescence</h3>
        <p className="type">noun (danh từ)</p>
        <p className="definition">Sự phát sáng mà không sinh ra nhiệt; ánh sáng huỳnh quang.</p>
      </div>
    </section>
  );
};

// Component Chính chứa toàn bộ ứng dụng
function App() {
  const handleSearchWord = (word) => {
    // Tạm thời chúng ta chỉ in ra console, sau này sẽ gọi API ở đây
    console.log("Người dùng đang tìm từ: ", word);
    alert(`Bạn đang tìm từ: ${word}\n(Chức năng hiển thị kết quả sẽ được xây dựng sau)`);
  };

  return (
    <div className="app-container">
      <Header />
      <main>
        <SearchSection onSearch={handleSearchWord} />
        <WordOfTheDay />
      </main>
      <footer className="footer">
        <p>&copy; 2026 MyDictionary. Bản quyền thuộc về bạn.</p>
      </footer>
    </div>
  );
}

export default App;