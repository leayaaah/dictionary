import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Words.css'; 

const ITEMS_PER_PAGE = 10;

// Nhận thêm searchKeyword từ component App truyền xuống
const Words = ({ searchKeyword }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false); // Đổi mặc định thành false để tránh chớp nhoáng
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Khi từ khóa tìm kiếm thay đổi, luôn quay về trang 1
  useEffect(() => {
    setPage(1);
  }, [searchKeyword]);

  // Lấy dữ liệu khi đổi trang hoặc khi từ khóa tìm kiếm thay đổi
  useEffect(() => {
    fetchWords();
  }, [page, searchKeyword]);

  async function fetchWords() {
    try {
      setLoading(true);
      
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Xây dựng câu lệnh Query cơ bản
      let query = supabase
        .from('Words')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .range(from, to);

      // Nếu có từ khóa tìm kiếm, thêm điều kiện lọc vào Query
      if (searchKeyword) {
        // Tìm kiếm chuỗi (không phân biệt hoa/thường) trong cột word_st HOẶC cột word_vi
        query = query.or(`word_st.ilike.%${searchKeyword}%,word_vi.ilike.%${searchKeyword}%`);
      }

      // Thực thi Query
      const { data, count, error } = await query;

      if (error) throw error;
      
      if (data) {
        setWords(data);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu: ", error.message);
    } finally {
      setLoading(false);
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
                </tr>
              </thead>
              <tbody>
                {words.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">
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
};

export default Words;