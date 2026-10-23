import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function LogoutToast({ show, onClose }) {
  useEffect(() => {
    if (!show) return undefined;

    const timeoutId = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" aria-live="polite" aria-atomic="true">
      <div className="toast show align-items-center text-bg-success border-0" role="status">
        <div className="d-flex">
          <div className="toast-body">Bạn đã đăng xuất thành công!</div>
          <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onClose} aria-label="Đóng thông báo" />
        </div>
      </div>
    </div>
  );
}

export default LogoutToast;
