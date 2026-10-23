import React, { useState, useEffect } from 'react';
import { getRandomWord } from '../services/wordService';
import './WordOfTheDay.css'; // Import file CSS vào đây

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WordOfTheDay = () => {
  const [wordOfDay, setWordOfDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWordOfDay();

    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const midnightTimer = window.setTimeout(loadWordOfDay, nextDay.getTime() - now.getTime());

    return () => window.clearTimeout(midnightTimer);
  }, []);

  const loadWordOfDay = async () => {
    try {
      setLoading(true);

      const todayKey = getTodayKey();
      const cached = localStorage.getItem('wordOfTheDay');
      if (cached) {
        const savedWord = JSON.parse(cached);
        if (savedWord.date === todayKey && savedWord.word) {
          setWordOfDay(savedWord.word);
          return;
        }
      }

      const word = await getRandomWord();
      setWordOfDay(word);

      if (word) {
        // StrictMode may run the effect twice in development; keep the first
        // word selected today so both requests settle on the same result.
        const latest = localStorage.getItem('wordOfTheDay');
        const latestWord = latest ? JSON.parse(latest) : null;
        if (latestWord?.date === todayKey && latestWord.word) {
          setWordOfDay(latestWord.word);
        } else {
          localStorage.setItem('wordOfTheDay', JSON.stringify({ date: todayKey, word }));
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy từ của ngày: ', error.message);
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

      </div>
    </section>
  );
};

export default WordOfTheDay;
