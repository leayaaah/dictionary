import React, { useState, useEffect, useMemo } from 'react';
import { getAllWords } from '../services/wordService';
import { addFavorite, getFavoriteIds, removeFavorite } from '../services/profileService';
import './Words.css'; 

const ITEMS_PER_PAGE = 10;

// Nhận thêm searchKeyword từ component App truyền xuống
function GetWordsPage({ searchKeyword, currentUser }) {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState({ keyword: '', page: 1 });
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    getAllWords()
      .then((result) => {
        if (!isMounted) return;
        setAllWords(result);
      })
      .catch((error) => console.error('Lỗi khi lấy dữ liệu:', error.message))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const searchResult = useMemo(
    () => searchWords(allWords, searchKeyword),
    [allWords, searchKeyword],
  );
  const filteredWords = searchResult.words;
  const bestMatch = searchResult.bestMatch;
  const fuzzyWords = searchResult.fuzzyWords;
  const pagedWords = searchKeyword ? fuzzyWords : filteredWords;
  const totalPages = Math.ceil(pagedWords.length / ITEMS_PER_PAGE);
  const page = pageState.keyword === searchKeyword ? pageState.page : 1;
  const words = useMemo(
    () => (searchKeyword ? fuzzyWords : filteredWords)
      .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filteredWords, fuzzyWords, page, searchKeyword],
  );
  const displayedWords = useMemo(
    () => (bestMatch ? [bestMatch, ...words] : words),
    [bestMatch, words],
  );

  useEffect(() => {
    if (!currentUser || !displayedWords.length) return;
    getFavoriteIds(displayedWords.map((word) => word.id))
      .then(setFavoriteIds)
      .catch((error) => console.error('Không thể tải từ yêu thích:', error));
  }, [currentUser, displayedWords]);

  async function toggleFavorite(wordId) {
    try {
      if (favoriteIds.has(wordId)) {
        await removeFavorite(wordId);
        setFavoriteIds((ids) => new Set([...ids].filter((id) => id !== wordId)));
      } else {
        await addFavorite(wordId);
        setFavoriteIds((ids) => new Set(ids).add(wordId));
      }
    } catch (error) {
      console.error('Không thể cập nhật từ yêu thích:', error);
    }
  }

  const handlePrevPage = () => {
    if (page > 1) setPageState({ keyword: searchKeyword, page: page - 1 });
  };

  const handleNextPage = () => {
    if (page < totalPages) setPageState({ keyword: searchKeyword, page: page + 1 });
  };

  const renderWordRow = (item) => (
    <tr key={item.id}>
      <td className="word-st">{item.word_st}</td>
      <td className="word-pos">{item.pos}</td>
      <td className="word-translation">{item.word_vi}</td>
      <td className="word-meaning">{item.meaning || '—'}</td>
      <td className="word-example">
        {item.example ? `"${item.example}"` : ''}
      </td>
      {currentUser && (
        <td>
          <button
            type="button"
            className={`favorite-button ${favoriteIds.has(item.id) ? 'is-favorite' : ''}`}
            onClick={() => toggleFavorite(item.id)}
            aria-label={favoriteIds.has(item.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            {favoriteIds.has(item.id) ? '★' : '☆'}
          </button>
        </td>
      )}
    </tr>
  );

  const renderTable = (items) => (
    <div className="table-responsive">
      <table className="words-table">
        <thead>
          <tr>
            <th>Từ vựng</th>
            <th>Loại từ</th>
            <th>Tiếng Việt</th>
            <th>Ý nghĩa</th>
            <th>Ví dụ</th>
            {currentUser && <th aria-label="Yêu thích">☆</th>}
          </tr>
        </thead>
        <tbody>{items.map(renderWordRow)}</tbody>
      </table>
    </div>
  );

  return (
    <section className="words-container">
      {/* Hiển thị tiêu đề thay đổi tùy theo việc có đang tìm kiếm hay không */}
      <h2 className="words-title">
        {searchKeyword ? `Kết quả tìm kiếm cho: "${searchKeyword}"` : "Danh sách từ vựng"}
      </h2>
      
      {loading ? (
        <p className="text-center">Đang tải dữ liệu...</p>
      ) : (
        <>
          {searchKeyword && bestMatch && (
            <>
              <h3 className="words-subtitle">
                {searchResult.bestMatchIsFuzzy ? 'Kết quả gần nhất' : 'Kết quả giống nhất'}
              </h3>
              {renderTable([bestMatch])}
            </>
          )}

          {searchKeyword && fuzzyWords.length > 0 && (
            <h3 className="words-subtitle">Các kết quả gần đúng</h3>
          )}

          {words.length > 0 ? renderTable(words) : (!bestMatch && (
            <p className="empty-message">
              {searchKeyword
                ? "Không tìm thấy từ nào phù hợp với từ khóa của bạn."
                : "Chưa có từ vựng nào trong cơ sở dữ liệu."}
            </p>
          ))}

          {totalPages > 0 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn"
                onClick={handlePrevPage} 
                disabled={page === 1}
              >
                Trước
              </button>
              
              <span className="pagination-info">
                Trang {page} / {totalPages}
              </span>
              
              <button 
                className="pagination-btn"
                onClick={handleNextPage} 
                disabled={page === totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function normalizeSearchText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, previous[rightIndex - 1], above) + 1;
      diagonal = above;
    }
  }

  return previous[right.length];
}

function getFuzzyDistance(query, text) {
  const candidates = text.split(/[\s,.;:!?()[\]{}"'/-]+/).filter(Boolean);
  return Math.min(
    ...candidates.map((candidate) => levenshteinDistance(query, candidate)),
    levenshteinDistance(query, text),
  );
}

function searchWords(words, keyword) {
  const query = normalizeSearchText(keyword);
  if (!query) return {
    words,
    bestMatch: null,
    fuzzyWords: [],
    bestMatchIsFuzzy: false,
  };

  const maxDistance = Math.max(1, Math.floor(query.length * 0.35));
  const matches = words
    .map((word) => {
      const searchableText = normalizeSearchText([
        word.word_st,
        word.word_vi,
        word.meaning,
      ].join(' '));
      const exactIndex = searchableText.indexOf(query);
      if (exactIndex >= 0) {
        return { word, score: exactIndex };
      }

      const distance = getFuzzyDistance(query, searchableText);
      return distance <= maxDistance ? { word, score: 100 + distance } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.score - right.score)
  const exactMatches = matches.filter(({ score }) => score < 100);
  const fuzzyMatches = matches.filter(({ score }) => score >= 100);
  const bestMatch = (exactMatches[0] || fuzzyMatches[0])?.word || null;
  const remainingMatches = exactMatches.length > 0
    ? [...exactMatches.slice(1), ...fuzzyMatches]
    : fuzzyMatches.slice(1);

  return {
    words: matches.map(({ word }) => word),
    bestMatch,
    fuzzyWords: remainingMatches.map(({ word }) => word),
    bestMatchIsFuzzy: exactMatches.length === 0 && Boolean(bestMatch),
  };
}

export default GetWordsPage;
