import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AppFooter from '../components/AppFooter';
import { getSession, signOut } from '../services/authService';
import {
  createContribution,
  deleteContribution,
  deleteSearchHistoryItem,
  getAccount,
  getContributions,
  getFavorites,
  getSearchHistory,
  updateAccount,
} from '../services/profileService';
import './ProfilePage.css';

const emptyContribution = { word: '', definition: '', part_of_speech: '', phonetic: '' };

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [form, setForm] = useState(emptyContribution);
  const [profileForm, setProfileForm] = useState({ full_name: '', avatar_url: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSession(), getAccount(), getFavorites(), getSearchHistory(), getContributions()])
      .then(([session, profile, savedFavorites, savedHistory, savedContributions]) => {
        setUser(session?.user || null);
        setProfileForm({ full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' });
        setFavorites(savedFavorites);
        setHistory(savedHistory);
        setContributions(savedContributions);
      })
      .catch((loadError) => {
        setError(loadError.message || 'Không thể tải thông tin hồ sơ.');
        getSession().then((session) => setUser(session?.user || null));
      });
  }, []);

  if (user === undefined) return <main className="profile-loading">Đang tải hồ sơ...</main>;
  if (!user) return <Navigate to="/" replace />;

  const displayName = profileForm.full_name || user.user_metadata?.full_name || user.email || 'Thành viên';
  const initials = displayName.slice(0, 1).toUpperCase();
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('vi-VN')
    : 'Thành viên của cộng đồng';

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await updateAccount(profileForm);
      setMessage('Đã cập nhật thông tin cá nhân.');
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật hồ sơ.');
    }
  };

  const submitContribution = async (event) => {
    event.preventDefault();
    if (!form.word.trim() || !form.definition.trim()) return;
    try {
      setError('');
      const created = await createContribution(form);
      setContributions((items) => [created, ...items]);
      setForm(emptyContribution);
      setMessage('Đóng góp đã được gửi và đang chờ kiểm duyệt.');
    } catch (submitError) {
      setError(submitError.message || 'Không thể gửi đóng góp.');
    }
  };

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <Header currentUser={user} onLogout={logout} />
      <main className="profile-page">
        <section className="profile-hero">
          <div className="profile-cover">
            <span className="profile-verified">✦ Thành viên cộng đồng S'tiêng</span>
          </div>
          <div className="profile-identity">
            <div className="profile-identity-main">
              <div className="profile-avatar">
                {profileForm.avatar_url ? (
                  <img src={profileForm.avatar_url} alt={`Ảnh đại diện của ${displayName}`} />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="profile-online" aria-label="Đang trực tuyến">✓</span>
              </div>
              <div className="profile-identity-copy">
                <p className="profile-eyebrow">KHÔNG GIAN CÁ NHÂN</p>
                <h1>{displayName}</h1>
                <div className="profile-meta">
                  <span>{user.email}</span>
                  <span aria-hidden="true">•</span>
                  <span>Tham gia từ {joinedDate}</span>
                </div>
              </div>
            </div>
            <div className="profile-hero-actions">
              <button type="button" className="profile-edit" onClick={() => setActiveTab('overview')}>✎ Chỉnh sửa hồ sơ</button>
              <button type="button" className="profile-settings" aria-label="Cài đặt tài khoản">⚙</button>
              <button type="button" className="profile-back" onClick={() => navigate('/')}>Về trang tra cứu</button>
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat profile-stat-amber"><strong>{favorites.length}</strong><span> Từ yêu thích</span></div>
            <div className="profile-stat profile-stat-mint"><strong>{history.length}</strong><span>Lượt tra cứu</span></div>
            <div className="profile-stat profile-stat-coral"><strong>{contributions.length}</strong><span>Từ đóng góp</span></div>
          </div>
        </section>
        {message && <p className="profile-message">{message}</p>}
        {error && <p className="profile-error">{error}</p>}
        <div className="profile-layout">
          <nav className="profile-tabs" aria-label="Các mục hồ sơ">
            {[
              ['overview', 'Thông tin cá nhân'],
              ['favorites', `Từ yêu thích (${favorites.length})`],
              ['history', 'Lịch sử tra cứu'],
              ['contributions', 'Đóng góp từ vựng'],
            ].map(([id, label]) => (
              <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>
            ))}
          </nav>
          <section className="profile-card">
            {activeTab === 'overview' && (
              <form onSubmit={saveProfile} className="profile-form">
                <h2>Thông tin cá nhân</h2>
                <label>Họ và tên<input value={profileForm.full_name} onChange={(event) => setProfileForm({ ...profileForm, full_name: event.target.value })} /></label>
                <label>Ảnh đại diện (URL)<input type="url" value={profileForm.avatar_url} onChange={(event) => setProfileForm({ ...profileForm, avatar_url: event.target.value })} placeholder="https://..." /></label>
                <label>Email<input value={user.email || ''} disabled /></label>
                <button className="profile-primary" type="submit">Lưu thay đổi</button>
              </form>
            )}
            {activeTab === 'favorites' && (
              <div>
                <h2>Từ yêu thích</h2>
                {!favorites.length ? <p className="profile-empty">Bạn chưa lưu từ nào. Hãy nhấn ☆ khi tra cứu.</p> : (
                  <div className="profile-list">{favorites.map((item) => {
                    const word = item.Words || {};
                    return <article className="profile-list-item" key={item.id}><strong>{word.word_st || word.word_vi || item.word_id}</strong><span>{word.meaning || word.word_vi || 'Chưa có định nghĩa'}</span></article>;
                  })}</div>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                <h2>Lịch sử tra cứu</h2>
                {!history.length ? <p className="profile-empty">Chưa có lịch sử tra cứu.</p> : (
                  <div className="profile-list">{history.map((item) => <article className="profile-list-item" key={item.id}><span>{item.search_query}</span><small>{new Date(item.searched_at).toLocaleString('vi-VN')}</small><button type="button" onClick={async () => { await deleteSearchHistoryItem(item.id); setHistory((items) => items.filter((historyItem) => historyItem.id !== item.id)); }}>Xóa</button></article>)}</div>
                )}
              </div>
            )}
            {activeTab === 'contributions' && (
              <div>
                <h2>Đóng góp từ vựng</h2>
                <form className="contribution-form" onSubmit={submitContribution}>
                  <input required placeholder="Từ mới *" value={form.word} onChange={(event) => setForm({ ...form, word: event.target.value })} />
                  <input required placeholder="Định nghĩa *" value={form.definition} onChange={(event) => setForm({ ...form, definition: event.target.value })} />
                  <input placeholder="Từ loại" value={form.part_of_speech} onChange={(event) => setForm({ ...form, part_of_speech: event.target.value })} />
                  <input placeholder="Phiên âm" value={form.phonetic} onChange={(event) => setForm({ ...form, phonetic: event.target.value })} />
                  <button className="profile-primary" type="submit">Gửi để kiểm duyệt</button>
                </form>
                <div className="profile-list">{contributions.map((item) => <article className="profile-list-item" key={item.id}><div><strong>{item.word}</strong><span>{item.definition}</span></div><span className={`status status-${item.status}`}>{item.status}</span>{item.status === 'pending' && <button type="button" onClick={async () => { await deleteContribution(item.id); setContributions((items) => items.filter((contribution) => contribution.id !== item.id)); }}>Xóa</button>}</article>)}</div>
              </div>
            )}
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

export default ProfilePage;
