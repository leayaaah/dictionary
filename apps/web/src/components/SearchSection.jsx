import { useState } from 'react';

function SearchSection({ onSearch, onClear }) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (keyword.trim()) onSearch(keyword.trim());
  };

  const handleClear = () => {
    setKeyword('');
    onClear();
  };

  return (
    <section className="search-section">
      <div className="hero-tag">Kho tàng tri thức &amp; ngữ liệu bản địa S'tiêng</div>
      <h1>Chào mừng bạn đến với <span>Từ điển trực tuyến S'tiêng</span></h1>
      <p className="hero-description">
        Cổng tra cứu ngữ âm học IPA, dịch nghĩa hai chiều tiếng S'tiêng - Tiếng Việt
        và lưu giữ những giá trị ngôn ngữ bản địa.
      </p>
      <form onSubmit={handleSubmit} className="search-form">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Bạn muốn tra từ gì? (ví dụ: Kơpô, rẫy, bri...)"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <button type="submit" className="search-button">Tra cứu <span aria-hidden="true">→</span></button>
        {keyword && <button type="button" className="clear-button" onClick={handleClear}>Xóa</button>}
      </form>
      <div className="suggestions" aria-label="Gợi ý phổ biến">
        <span className="suggestions-label">Gợi ý phổ biến:</span>
        {['Kơpô', 'Bri', 'Nhiêm', 'Sa', 'Cồng'].map((word) => (
          <button type="button" key={word} onClick={() => { setKeyword(word); onSearch(word); }}>
            {word}
          </button>
        ))}
      </div>
    </section>
  );
}

export default SearchSection;
