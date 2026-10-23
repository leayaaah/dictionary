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
      <h1>Chào mừng bạn đến với Từ điển trực tuyến S'tiêng</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Bạn muốn tra từ gì?"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <button type="submit" className="search-button">Tra cứu</button>
        {keyword && <button type="button" className="clear-button" onClick={handleClear}>Xóa</button>}
      </form>
    </section>
  );
}

export default SearchSection;
