import React, { useState, useEffect } from 'react';
import { getWordsPage } from '../services/wordService';
import { addFavorite, getFavoriteIds, removeFavorite } from '../services/profileService';
import './Words.css'; 

const ITEMS_PER_PAGE = 10;

// Nhận thêm searchKeyword từ component App truyền xuống
function GetWordsPage({ searchKeyword, currentUser }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    getWordsPage({ page, pageSize: ITEMS_PER_PAGE, searchKeyword })
      .then((result) => {
        if (!isMounted) return;
        setWords(result.words);
        setTotalPages(result.totalPages);
      })
      .catch((error) => console.error('Lỗi khi lấy dữ liệu:', error.message))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [page, searchKeyword]);

  useEffect(() => {
    if (!currentUser || !words.length) return;
    getFavoriteIds(words.map((word) => word.id))
      .then(setFavoriteIds)
      .catch((error) => console.error('Không thể tải từ yêu thích:', error));
  }, [currentUser, words]);

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
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

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
              <tbody>
                {words.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser ? 6 : 5} className="empty-message">
                      {searchKeyword 
                        ? "Không tìm thấy từ nào phù hợp với từ khóa của bạn." 
                        : "Chưa có từ vựng nào trong cơ sở dữ liệu."}
                    </td>
                  </tr>
                ) : (
                  words.map((item) => (
                    <tr key={item.id}>
                      <td className="word-st">{item.word_st}</td>
                      <td className="word-pos">{item.pos}</td>
                      <td>{item.word_vi}</td>
                      <td>{item.meaning}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

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

export default GetWordsPage;
