import React from 'react';
import { useEffect, useRef, useState } from 'react';
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
  removeProfileAvatarByUrl,
  updateAccount,
  uploadProfileAvatar,
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
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    getSession()
      .then(async (session) => {
        if (!active) return;
        const sessionUser = session?.user || null;
        if (!sessionUser) {
          setUser(null);
          return;
        }

        const [profile, savedFavorites, savedHistory, savedContributions] = await Promise.all([
          getAccount(),
          getFavorites(),
          getSearchHistory(),
          getContributions(),
        ]);
        if (!active) return;
        setUser(sessionUser);
        setProfileForm({ full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' });
        setFavorites(savedFavorites);
        setHistory(savedHistory);
        setContributions(savedContributions);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || 'Không thể tải thông tin hồ sơ.');
        getSession().then((session) => setUser(session?.user || null));
      });
    return () => { active = false; };
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

  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Ảnh đại diện cần có định dạng JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh đại diện không được vượt quá 5 MB.');
      return;
    }

    let uploadedAvatar;
    const previousAvatarUrl = profileForm.avatar_url;
    setIsAvatarUploading(true);
    setError('');
    setMessage('');
    try {
      uploadedAvatar = await uploadProfileAvatar(file, user.id);
      await updateAccount({ ...profileForm, avatar_url: uploadedAvatar.publicUrl });
      setProfileForm((current) => ({ ...current, avatar_url: uploadedAvatar.publicUrl }));
      setMessage('Ảnh đại diện đã được cập nhật.');
      if (previousAvatarUrl && previousAvatarUrl !== uploadedAvatar.publicUrl) {
        removeProfileAvatarByUrl(previousAvatarUrl, user.id).catch((cleanupError) => console.warn('Không thể xóa ảnh đại diện cũ:', cleanupError));
      }
    } catch (uploadError) {
      if (uploadedAvatar) {
        removeProfileAvatarByUrl(uploadedAvatar.publicUrl, user.id).catch(() => {});
      }
      const errorMessage = uploadError.message || '';
      setError(/bucket not found/i.test(errorMessage)
        ? 'Kh\u00f4ng t\u00ecm th\u1ea5y bucket profile-avatars tr\u00ean Supabase. H\u00e3y \u00e1p d\u1ee5ng migration 202610241300_profile_avatar_storage.sql r\u1ed3i th\u1eed l\u1ea1i.'
        : errorMessage || 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u1ea3nh \u0111\u1ea1i di\u1ec7n l\u00ean. Vui l\u00f2ng th\u1eed l\u1ea1i.');
    } finally {
      setIsAvatarUploading(false);
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
          <div className="profile-identity-panel">
            <div className="profile-identity">
              <div className="profile-identity-main">
                <div className="profile-avatar">
                  {profileForm.avatar_url ? (
                    <img src={profileForm.avatar_url} alt={`Ảnh đại diện của ${displayName}`} />
                  ) : (
                    <span>{initials}</span>
                  )}
                  {/* <span className="profile-online" aria-label="Đang trực tuyến">✓</span> */}
                  <button
                    type="button"
                    className="profile-avatar-change"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarUploading}
                    aria-label={isAvatarUploading ? 'Đang tải ảnh đại diện lên' : 'Đổi ảnh đại diện'}
                    title={isAvatarUploading ? 'Đang tải ảnh lên…' : 'Đổi ảnh đại diện'}
                  >
                    {isAvatarUploading ? <span className="profile-avatar-spinner" /> : (
                      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                    )}
                  </button>
                  <input ref={avatarInputRef} className="profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={changeAvatar} aria-label="Chọn ảnh đại diện" />
                </div>
                <div className="profile-identity-copy">
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
                <p className="profile-avatar-hint">Chọn biểu tượng máy ảnh trên ảnh đại diện để tải ảnh mới lên (JPG, PNG hoặc WebP, tối đa 5 MB).</p>
                <label>Email<input value={user.email || ''} disabled /></label>
                <button className="profile-primary" type="submit" disabled={isAvatarUploading}>Lưu thay đổi</button>
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
                  <div className="profile-list">{history.map((item) => <article className="profile-list-item" key={item.id}><span className="profile-list-value">{item.search_query}</span><small>{new Date(item.searched_at).toLocaleString('vi-VN')}</small><button type="button" onClick={async () => { await deleteSearchHistoryItem(item.id); setHistory((items) => items.filter((historyItem) => historyItem.id !== item.id)); }}>Xóa</button></article>)}</div>
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

export default React.memo(ProfilePage);
