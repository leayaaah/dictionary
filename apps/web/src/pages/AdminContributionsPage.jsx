import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getSession, signOut } from '../services/authService';
import { getAdminContributions, moderateContribution } from '../services/profileService';
import { getContributionStatusLabel } from '@dictionary/shared/profileService';
import './AdminContributionsPage.css';

const PAGE_SIZE = 20;

export default function AdminContributionsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSession().then((session) => setUser(session?.user || null)).catch(() => setUser(null));
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const result = await getAdminContributions({ status, search, page, pageSize: PAGE_SIZE });
      setItems(result.contributions);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách đóng góp.');
    } finally {
      setBusy(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    if (user?.app_metadata?.role === 'admin') void Promise.resolve().then(load);
  }, [user, load]);

  if (user === undefined) return <main className="admin-contributions"><p>Đang tải phiên đăng nhập…</p></main>;
  if (!user || user.app_metadata?.role !== 'admin') return <Navigate to="/" replace />;

  const review = async (action) => {
    if (!selected || selected.status !== 'pending' || busy) return;
    if (action === 'reject' && !note.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await moderateContribution(action, selected.id, note);
      setSelected(null);
      setNote('');
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Không thể xử lý đóng góp.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await signOut();
    navigate('/');
  };
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <><Header currentUser={user} onLogout={logout} /><main className="admin-contributions">
    <h1>Quản lý đóng góp từ vựng</h1>
    {error && <p role="alert">{error}</p>}
    <div className="admin-contribution-controls">
      <label>Trạng thái <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
        <option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Bị từ chối</option><option value="all">Tất cả</option>
      </select></label>
      <label>Tìm theo từ <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
    </div>
    {busy && <p role="status">Đang tải danh sách…</p>}
    {!busy && !error && !items.length && <p className="admin-contribution-empty">Không có đóng góp nào phù hợp.</p>}
    {items.length > 0 && <div className="admin-contribution-list">{items.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); setNote(''); }}>
      <strong>{item.word}</strong><span>{getContributionStatusLabel(item.status)}</span><small>{new Date(item.created_at).toLocaleString('vi-VN')}</small>
    </button>)}</div>}
    <nav aria-label="Phân trang">
      <button type="button" disabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>Trước</button>
      <span>Trang {page} / {pageCount}</span>
      <button type="button" disabled={page >= pageCount || busy} onClick={() => setPage((value) => value + 1)}>Sau</button>
    </nav>
    {selected && <section className="admin-contribution-detail" aria-label="Chi tiết đóng góp">
      <button type="button" onClick={() => setSelected(null)}>Đóng</button>
      <h2>{selected.word}</h2><p>{selected.definition}</p>
      <p>Từ loại: {selected.part_of_speech || '—'} · Phiên âm: {selected.phonetic || '—'}</p>
      <p>Người gửi: {selected.Accounts?.full_name || selected.account_id}</p>
      <p>Trạng thái: {getContributionStatusLabel(selected.status)}</p>
      {selected.published_word_id && <p>Mã từ đã duyệt: {selected.published_word_id}</p>}
      {selected.admin_note && <p>Lý do từ chối: {selected.admin_note}</p>}
      {selected.status === 'pending' && <>
        <label>Lý do từ chối <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} /></label>
        <div className="admin-contribution-actions">
          <button type="button" disabled={busy} onClick={() => review('approve')}>Duyệt</button>
          <button type="button" disabled={busy || !note.trim()} onClick={() => review('reject')}>Từ chối</button>
        </div>
      </>}
    </section>}
  </main></>;
}
