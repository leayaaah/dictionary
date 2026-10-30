import React from 'react';

function AppFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          {/* Cột 1: Hỗ trợ & Góp ý */}
          <div style={styles.column}>
            <h3 style={styles.heading}>Hỗ trợ & Góp ý</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <a href="#report" style={styles.link}>Báo lỗi từ ngữ / Dịch thuật</a>
              </li>
              <li style={styles.listItem}>
                <a href="#contribute" style={styles.link}>Đóng góp từ mới</a>
              </li>
              <li style={styles.listItem}>
                <a href="#help" style={styles.link}>Trung tâm trợ giúp (FAQ)</a>
              </li>
              <li style={styles.listItem}>
                <a href="#contact" style={styles.link}>Liên hệ hỗ trợ</a>
              </li>
            </ul>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div style={styles.column}>
            <h3 style={styles.heading}>Về chúng tôi</h3>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <a href="#about" style={styles.link}>Giới thiệu từ điển</a>
              </li>
              <li style={styles.listItem}>
                <a href="#terms" style={styles.link}>Điều khoản sử dụng</a>
              </li>
              <li style={styles.listItem}>
                <a href="#privacy" style={styles.link}>Chính sách bảo mật</a>
              </li>
              <li style={styles.listItem}>
                <a href="#socials" style={styles.link}>Mạng xã hội & Kết nối</a>
              </li>
            </ul>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Thông tin Copyright */}
        <div style={styles.copyright}>
          <p style={{ margin: 0 }}>
            &copy; 2026 THUYLY - A 20 years old person.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Style thuần tự viết bằng JS Object (Inline Styles)
const styles = {
  footer: {
    backgroundColor: 'rgba(13, 57, 48, 0.48)',
    color: '#ffffff',
    padding: '32px 16px 16px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '960px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  heading: {
    color: '#ffc107',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    marginTop: 0,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: '8px',
  },
  link: {
    color: '#b0b0b0',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s ease',
  },
  divider: {
    borderTop: '1px solid #333333',
    marginBottom: '16px',
  },
  copyright: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#888888',
  },
};

export default AppFooter;