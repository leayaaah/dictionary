import SecondaryPageLayout from '../components/SecondaryPageLayout';
import './SecondaryPages.css';

const topics = [
  { icon: '⌁', title: 'Ngôn ngữ lưu giữ ký ức', text: 'Mỗi từ ngữ mang theo cách gọi tên sự vật, kinh nghiệm sống và ký ức được trao truyền qua nhiều thế hệ.' },
  { icon: '◌', title: 'Học từ cộng đồng', text: 'Lắng nghe người nói bản ngữ, chú ý ngữ cảnh và cách phát âm; thực hành cùng nhau giúp việc học gần gũi hơn.' },
  { icon: '✦', title: 'Tôn trọng sự đa dạng', text: 'Cách dùng từ có thể khác nhau theo người nói và hoàn cảnh. Hãy học với sự tò mò, cởi mở và tôn trọng.' },
];

function CultureContent() {
  return (
    <section className="secondary-page culture-page">
      <div className="culture-hero">
        <span className="secondary-eyebrow">VĂN HÓA &amp; NGÔN NGỮ</span>
        <h1>Ngôn ngữ là nhịp cầu nối những thế hệ.</h1>
        <p>Cùng tìm hiểu những giá trị văn hóa qua việc học và gìn giữ tiếng nói địa phương.</p>
      </div>
      <h2 className="culture-section-title">Góc khám phá</h2>
      <div className="culture-topic-list">
        {topics.map((topic, index) => (
          <article className="culture-topic-card" key={topic.title}>
            <span className={`culture-topic-icon${index === 1 ? ' is-gold' : ''}`} aria-hidden="true">{topic.icon}</span>
            <div><h3>{topic.title}</h3><p>{topic.text}</p></div>
          </article>
        ))}
      </div>
      <p className="culture-footnote">Nội dung giới thiệu · Sẽ được bổ sung thêm</p>
    </section>
  );
}

export default function CulturePage() {
  return <SecondaryPageLayout>{() => <CultureContent />}</SecondaryPageLayout>;
}
