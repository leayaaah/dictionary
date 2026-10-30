import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getSession, signOut } from '../services/authService';
import { getAdminContributions, moderateContribution, updateContribution } from '../services/profileService';
import { getContributionStatusLabel, validateContribution } from '@dictionary/shared/profileService';
import './AdminContributionsPage.css';

const PAGE_SIZE = 20;
const STATUS_FILTERS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'all', label: 'Tất cả' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
}

function getSender(item) {
  return item.Accounts?.full_name || item.account_id || 'Không rõ người gửi';
}

function getContributionDraft(item) {
  return {
    word_st: item.word_st || item.word || '',
    word_vi: item.word_vi || '',
    meaning: item.meaning || item.definition || '',
    pos: item.pos || item.part_of_speech || '',
    phonetic: item.phonetic || '',
    example: item.example || '',
  };
}

export default function AdminContributionsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  if (user === undefined) {
    return <main className="admin-contributions admin-contributions-state"><p role="status">Đang tải phiên đăng nhập…</p></main>;
  }
  if (!user || user.app_metadata?.role !== 'admin') return <Navigate to="/" replace />;

  const review = async (action) => {
    if (!selected || selected.status !== 'pending' || busy || draftDirty) return;
    if (action === 'reject' && !note.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await moderateContribution(action, selected.id, note);
      setSelected(null);
      setNote('');
      setSuccess(action === 'approve' ? 'Đã duyệt đóng góp.' : 'Đã từ chối đóng góp.');
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Không thể xử lý đóng góp.');
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!selected || selected.status !== 'pending' || !draft || savingDraft) return;
    const { normalized, errors } = validateContribution(draft);
    if (Object.keys(errors).length) {
      setError(Object.values(errors)[0]);
      return;
    }
    setSavingDraft(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateContribution(selected.id, normalized);
      const updatedWithSender = { ...updated, Accounts: selected.Accounts };
      setSelected(updatedWithSender);
      setDraft(getContributionDraft(updatedWithSender));
      setDraftDirty(false);
      setItems((current) => current.map((item) => item.id === updatedWithSender.id ? updatedWithSender : item));
      setSuccess('ÄÃ£ lÆ°u chá»‰nh sá»­a Ä‘Ã³ng gÃ³p.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'KhÃ´ng thá»ƒ lÆ°u chá»‰nh sá»­a.');
    } finally {
      setSavingDraft(false);
    }
  };

  const selectContribution = (item) => {
    setSelected(item);
    setDraft(getContributionDraft(item));
    setDraftDirty(false);
    setNote('');
    setError('');
  };

  const selectStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    setSuccess('');
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Header currentUser={user} onLogout={async () => { await signOut(); navigate('/'); }} />
      <main className="admin-contributions">
        <section className="admin-contributions-heading" aria-labelledby="admin-contributions-title">
          <div>
            <p className="admin-eyebrow">Khu vực quản trị</p>
            <h1 id="admin-contributions-title">Duyệt từ vựng cộng đồng</h1>
            <p className="admin-subtitle">Kiểm tra nội dung mới trước khi đưa vào từ điển.</p>
          </div>
          <div className="admin-total" aria-label={`${total} đóng góp trong bộ lọc hiện tại`}>
            <strong>{total}</strong>
            <span>đóng góp</span>
          </div>
        </section>

        <section className="admin-toolbar" aria-label="Bộ lọc đóng góp">
          <div className="admin-status-filters" role="group" aria-label="Lọc theo trạng thái">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={status === filter.value ? 'is-active' : ''}
                aria-pressed={status === filter.value}
                onClick={() => selectStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="admin-search">
            <span>Tìm kiếm từ vựng</span>
            <input
              type="search"
              value={search}
              placeholder="Nhập từ cần tìm…"
              aria-label="Tìm kiếm từ vựng"
              onChange={(event) => { setSearch(event.target.value); setPage(1); setSuccess(''); }}
            />
          </label>
        </section>

        {error && <div className="admin-feedback admin-feedback-error" role="alert">{error}</div>}
        {success && <div className="admin-feedback admin-feedback-success" role="status">{success}</div>}

        <section className="admin-content" aria-live="polite">
          <div className="admin-list-panel">
            <div className="admin-list-heading">
              <h2>Danh sách đóng góp</h2>
              <span>{busy ? 'Đang cập nhật…' : `${items.length} mục trên trang này`}</span>
            </div>

            {busy && <div className="admin-inline-state" role="status"><span className="admin-spinner" aria-hidden="true" />Đang tải danh sách…</div>}
            {!busy && !error && !items.length && (
              <div className="admin-inline-state admin-empty-state">
                <span className="admin-empty-icon" aria-hidden="true">⌕</span>
                <strong>Chưa có đóng góp phù hợp</strong>
                <span>Thử đổi trạng thái hoặc từ khóa tìm kiếm.</span>
              </div>
            )}
            {!busy && items.length > 0 && (
              <ul className="admin-contribution-list" aria-label="Các đóng góp từ vựng">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`admin-contribution-item ${selected?.id === item.id ? 'is-selected' : ''}`}
                      aria-label={`Xem chi tiết từ ${item.word_st}`}
                      aria-pressed={selected?.id === item.id}
                      onClick={() => selectContribution(item)}
                    >
                      <span className="admin-item-main">
                        <strong>{item.word_st}</strong>
                        <span>{item.word_vi || 'Chưa có nghĩa tiếng Việt'} · {item.meaning}</span>
                      </span>
                      <span className={`admin-status admin-status-${item.status}`}>{getContributionStatusLabel(item.status)}</span>
                      <span className="admin-item-meta"><span>{getSender(item)}</span><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <nav className="admin-pagination" aria-label="Phân trang đóng góp">
              <button type="button" disabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>Trước</button>
              <span>Trang {page} / {pageCount}</span>
              <button type="button" disabled={page >= pageCount || busy} onClick={() => setPage((value) => value + 1)}>Sau</button>
            </nav>
          </div>

          {selected && (
            <aside className="admin-contribution-detail" aria-labelledby="admin-detail-title">
              <div className="admin-detail-heading">
                <div>
                  <p className="admin-eyebrow">Chi tiết đóng góp</p>
                  <h2 id="admin-detail-title">{selected.word_st}</h2>
                </div>
                <button type="button" className="admin-close-button" aria-label="Đóng chi tiết đóng góp" onClick={() => setSelected(null)}>×</button>
              </div>
              {selected.status === 'pending' && draft && (
                <div className="admin-edit-form">
                  <label>Từ S'tiêng<input value={draft.word_st} maxLength={100} onChange={(event) => { setDraft({ ...draft, word_st: event.target.value }); setDraftDirty(true); }} /></label>
                  <label>Nghĩa tiếng Việt<input value={draft.word_vi} maxLength={100} onChange={(event) => { setDraft({ ...draft, word_vi: event.target.value }); setDraftDirty(true); }} /></label>
                  <label>Từ loại<input value={draft.pos} maxLength={50} onChange={(event) => { setDraft({ ...draft, pos: event.target.value }); setDraftDirty(true); }} /></label>
                  <label>Định nghĩa<textarea value={draft.meaning} maxLength={1000} onChange={(event) => { setDraft({ ...draft, meaning: event.target.value }); setDraftDirty(true); }} /></label>
                  <label>Ví dụ<textarea value={draft.example} maxLength={1000} onChange={(event) => { setDraft({ ...draft, example: event.target.value }); setDraftDirty(true); }} /></label>
                  <label>Phiên âm<input value={draft.phonetic} maxLength={100} onChange={(event) => { setDraft({ ...draft, phonetic: event.target.value }); setDraftDirty(true); }} /></label>
                  <button type="button" className="admin-button admin-button-secondary" disabled={!draftDirty || savingDraft} onClick={saveDraft}>{savingDraft ? 'Đang lưu…' : 'Lưu chỉnh sửa'}</button>
                  {draftDirty && <small>Hãy lưu chỉnh sửa trước khi duyệt.</small>}
                </div>
              )}
              <dl className="admin-detail-fields">
                <div><dt>Định nghĩa</dt><dd>{selected.meaning}</dd></div>
                <div><dt>Người gửi</dt><dd>{getSender(selected)}</dd></div>
                <div><dt>Thời gian gửi</dt><dd>{formatDate(selected.created_at)}</dd></div>
                <div><dt>Từ loại</dt><dd>{selected.pos || '—'}</dd></div>
                <div><dt>Phiên âm</dt><dd>{selected.phonetic || '—'}</dd></div>
                <div><dt>Trạng thái</dt><dd><span className={`admin-status admin-status-${selected.status}`}>{getContributionStatusLabel(selected.status)}</span></dd></div>
              </dl>
              <div className="admin-detail-extra">
                <p><strong>Nghĩa tiếng Việt:</strong> {selected.word_vi || '—'}</p>
                <p><strong>Ví dụ:</strong> {selected.example || '—'}</p>
              </div>
              {selected.published_word_id && <p className="admin-detail-note">Mã từ đã duyệt: {selected.published_word_id}</p>}
              {selected.admin_note && <p className="admin-detail-note">Lý do từ chối: {selected.admin_note}</p>}
              {selected.status === 'pending' && (
                <div className="admin-review-form">
                  <label htmlFor="rejection-note">Lý do từ chối <span>(bắt buộc khi từ chối)</span></label>
                  <textarea id="rejection-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Nêu lý do để người gửi có thể cải thiện…" />
                  <div className="admin-contribution-actions">
                    <button type="button" className="admin-button admin-button-primary" disabled={busy || draftDirty || savingDraft} onClick={() => review('approve')}>Duyệt đóng góp</button>
                    <button type="button" className="admin-button admin-button-secondary" disabled={busy || !note.trim()} onClick={() => review('reject')}>Từ chối</button>
                  </div>
                </div>
              )}
            </aside>
          )}
        </section>
      </main>
    </>
  );
}
