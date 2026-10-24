import { useEffect, useState } from 'react';
import { getFavorites, removeFavorite } from '../services/profileService';
import SecondaryPageLayout from '../components/SecondaryPageLayout';
import './SecondaryPages.css';

function NotebookContent({ currentUser, isAuthInitializing, openLogin }) {
  const [favorites, setFavorites] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const loading = Boolean(currentUser && loadedUserId !== currentUser.id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return undefined;
    let active = true;
    getFavorites()
      .then((items) => {
        if (!active) return;
        setFavorites(items);
        setLoadedUserId(currentUser.id);
      })
      .catch(() => {
        if (!active) return;
        setError('Chưa thể tải sổ tay. Vui lòng thử lại.');
        setLoadedUserId(currentUser.id);
      });
    return () => { active = false; };
  }, [currentUser]);

  const handleRemove = async (wordId) => {
    try {
      await removeFavorite(wordId);
      setFavorites((items) => items.filter((item) => item.word_id !== wordId));
    } catch {
      setError('Không thể bỏ lưu từ này. Vui lòng thử lại.');
    }
  };

  return (
    <section className="secondary-page notebook-page">
      <div className="secondary-heading">
        <span className="secondary-eyebrow">GÓC HỌC TẬP</span>
        <h1>Sổ tay từ vựng</h1>
        <p>Những từ bạn yêu thích, sẵn sàng để ôn tập bất cứ lúc nào.</p>
      </div>
      {isAuthInitializing || loading ? <p className="secondary-status">Đang tải sổ tay…</p> : null}
      {!isAuthInitializing && !currentUser ? (
        <div className="secondary-empty">
          <span className="secondary-empty-icon" aria-hidden="true">☆</span>
          <h2>Đăng nhập để mở sổ tay</h2>
          <p>Lưu những từ bạn muốn ghi nhớ và xem lại tại đây.</p>
          <button type="button" className="secondary-primary-button" onClick={openLogin}>Đăng nhập</button>
        </div>
      ) : null}
      {error ? <p className="secondary-error" role="alert">{error}</p> : null}
      {!loading && !error && currentUser && loadedUserId === currentUser.id && favorites.length === 0 ? (
        <div className="secondary-empty">
          <span className="secondary-empty-icon" aria-hidden="true">☆</span>
          <h2>Sổ tay đang trống</h2>
          <p>Nhấn vào ngôi sao cạnh một từ trong danh sách để lưu lại tại đây.</p>
        </div>
      ) : null}
      {currentUser && loadedUserId === currentUser.id && favorites.length > 0 ? (
        <div className="notebook-list">
          {favorites.map((favorite) => {
            const word = favorite.Words;
            if (!word) return null;
            return (
              <article className="notebook-word-card" key={favorite.id}>
                <div className="notebook-word-top">
                  <div><h2>{word.word_st}</h2><span>{word.pos || 'Từ vựng'}</span></div>
                  <button type="button" className="notebook-remove" onClick={() => handleRemove(favorite.word_id)} aria-label={`Bỏ lưu ${word.word_st}`}>★</button>
                </div>
                <p className="notebook-translation">{word.word_vi}</p>
                {word.meaning ? <p className="notebook-meaning">{word.meaning}</p> : null}
                {word.example ? <p className="notebook-example">{word.example}</p> : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default function NotebookPage() {
  return <SecondaryPageLayout>{(props) => <NotebookContent {...props} />}</SecondaryPageLayout>;
}
