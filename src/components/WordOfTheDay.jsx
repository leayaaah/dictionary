import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
      
      // 1. Lấy tổng số lượng từ hiện có
      const { count, error: countError } = await supabase
        .from('Words')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      if (count > 0) {
        // 2. Tạo một số ngẫu nhiên
        const randomIndex = Math.floor(Math.random() * count);

        // 3. Lấy 1 từ tại vị trí ngẫu nhiên
        const { data, error: dataError } = await supabase
          .from('Words')
          .select('*')
          .range(randomIndex, randomIndex)
          .single();

        if (dataError) throw dataError;
        if (data) setWordOfDay(data);
      }
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