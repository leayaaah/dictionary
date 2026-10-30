import { useEffect, useRef, useState } from 'react';

function SearchSection({ onSearch }) {
  const [keyword, setKeyword] = useState('');
  const lastDispatchedKeyword = useRef('');

  useEffect(() => {
    const normalizedKeyword = keyword.trim();
    const timeoutId = setTimeout(() => {
      if (normalizedKeyword === lastDispatchedKeyword.current) return;

      lastDispatchedKeyword.current = normalizedKeyword;
      onSearch(normalizedKeyword);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [keyword, onSearch]);

  const clear = () => {
    setKeyword('');
    lastDispatchedKeyword.current = '';
    onSearch('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword === lastDispatchedKeyword.current) return;

    lastDispatchedKeyword.current = normalizedKeyword;
    onSearch(normalizedKeyword);
  };

  return (
    <section className="search-section">
      <div className="hero-tag">Kho tàng tri thức &amp; ngữ liệu bản địa S'tiêng</div>
      <h1>Chào mừng bạn đến với <span>Từ điển trực tuyến S'tiêng</span></h1>
      <p className="hero-description">
        Cổng tra cứu, dịch nghĩa hai chiều tiếng S'tiêng - Tiếng Việt
        và lưu giữ những giá trị ngôn ngữ bản địa.
      </p>
      <form onSubmit={handleSubmit} className="search-form">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Bạn muốn tra từ gì? (ví dụ: Mêy, ba, cưt ...)"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        {/* <button type="submit" className="search-button">Tra cứu</button> */}
        {keyword && (
          <button type="button" className="clear-button" onClick={clear} aria-label="Xóa từ khóa tìm kiếm">✕</button>
        )}
      </form>
      <div className="suggestions" aria-label="Gợi ý phổ biến">
        <span className="suggestions-label">Gợi ý phổ biến:</span>
        {['Mêy', 'Ba', 'Cưt', 'Ap', 'Băp'].map((word) => (
          <button type="button" key={word} onClick={() => { setKeyword(word); onSearch(word); }}>
            {word}
          </button>
        ))}
      </div>
    </section>
  );
}

export default SearchSection;
