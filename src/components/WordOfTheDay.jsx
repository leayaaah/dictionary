import React, { useState, useEffect } from 'react';
import { getRandomWord } from '../services/wordService';
import './WordOfTheDay.css'; // Import file CSS vào đây

const WordOfTheDay = () => {
  const [wordOfDay, setWordOfDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomWord();
  }, []);

  const fetchRandomWord = async () => {
    try {
      setLoading(true);
      
      const word = await getRandomWord();
      setWordOfDay(word);
    } catch (error) {
      console.error("Lỗi khi lấy từ ngẫu nhiên: ", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="word-of-day-container">
        <h2 className="word-of-day-title">Từ của ngày</h2>
        <div className="word-card loading-text">
          <p>Đang tìm một từ thú vị cho bạn...</p>
        </div>
      </section>
    );
  }

  if (!wordOfDay) return null;

  return (
    <section className="word-of-day-container">
      <h2 className="word-of-day-title">Từ của ngày</h2>
      
      <div className="word-card">
        <h3 className="word-title">{wordOfDay.word_st}</h3>
        <p className="word-pos">{wordOfDay.pos}</p>
        
        <p className="word-detail">
          <strong>Tiếng Việt:</strong> {wordOfDay.word_vi}
        </p>
        <p className="word-detail">
          <strong>Ý nghĩa:</strong> {wordOfDay.meaning}
        </p>
        
        {wordOfDay.example && (
          <p className="word-example">
            <em>Ví dụ: "{wordOfDay.example}"</em>
          </p>
        )}

        <button 
          className="refresh-button"
          onClick={fetchRandomWord}
        >
          🔄 Đổi từ khác
        </button>
      </div>
    </section>
  );
};

export default WordOfTheDay;