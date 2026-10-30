import './AppFooter.css';

const supportLinks = [
  { label: 'Báo lỗi từ ngữ / dịch thuật', href: '#report' },
  { label: 'Đóng góp từ mới', href: '#contribute' },
  { label: 'Trung tâm trợ giúp (FAQ)', href: '#help' },
  { label: 'Liên hệ hỗ trợ', href: '#contact' },
];

const aboutLinks = [
  { label: 'Giới thiệu từ điển', href: '#about' },
  { label: 'Điều khoản sử dụng', href: '#terms' },
  { label: 'Chính sách bảo mật', href: '#privacy' },
  { label: 'Mạng xã hội & kết nối', href: '#socials' },
];

function FooterLinkGroup({ id, title, links }) {
  return (
    <section className="app-footer__section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="app-footer__title">{title}</h2>
      <ul className="app-footer__links">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__container">
        <div className="app-footer__content">
          <FooterLinkGroup id="support" title="Hỗ trợ & góp ý" links={supportLinks} />
          <FooterLinkGroup id="about" title="Về chúng tôi" links={aboutLinks} />

          <section className="app-footer__section app-footer__copyright" aria-labelledby="copyright-title">
            <h2 id="copyright-title" className="app-footer__title">Thông tin bản quyền</h2>
            <p>
              © 2026 SDictionary
              <br />
              Từ điển học tập dành cho mọi người.
            </p>
          </section>
        </div>

        <div className="app-footer__bottom">
          <span>© 2026 SDictionary. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
