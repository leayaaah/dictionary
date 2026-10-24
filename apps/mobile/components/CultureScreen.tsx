import { ScrollView, Text, View } from 'react-native';
import { styles } from '../theme';

const topics = [
  { icon: '⌁', title: 'Ngôn ngữ lưu giữ ký ức', body: 'Mỗi từ ngữ mang theo cách gọi tên sự vật, kinh nghiệm sống và ký ức được trao truyền qua nhiều thế hệ.' },
  { icon: '◌', title: 'Học từ cộng đồng', body: 'Lắng nghe người nói bản ngữ, chú ý ngữ cảnh và cách phát âm; thực hành cùng nhau giúp việc học gần gũi hơn.' },
  { icon: '✦', title: 'Tôn trọng sự đa dạng', body: 'Cách dùng từ có thể khác nhau theo người nói và hoàn cảnh. Hãy học với sự tò mò, cởi mở và tôn trọng.' },
];

export default function CultureScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.cultureHero}>
        <Text style={styles.cultureEyebrow}>VĂN HÓA & NGÔN NGỮ</Text>
        <Text style={styles.cultureTitle}>Ngôn ngữ là nhịp cầu nối những thế hệ.</Text>
        <Text style={styles.cultureLead}>Cùng tìm hiểu những giá trị văn hóa qua việc học và gìn giữ tiếng nói địa phương.</Text>
      </View>
      <Text style={styles.cultureSectionTitle}>Góc khám phá</Text>
      {topics.map((topic, index) => (
        <View key={topic.title} style={styles.cultureCard}>
          <View style={[styles.cultureIcon, index === 1 && styles.cultureIconGold]}><Text style={styles.cultureIconText}>{topic.icon}</Text></View>
          <View style={styles.cultureCopy}><Text style={styles.cultureCardTitle}>{topic.title}</Text><Text style={styles.cultureCardText}>{topic.body}</Text></View>
        </View>
      ))}
      <Text style={styles.cultureFootnote}>Nội dung giới thiệu · Sẽ được bổ sung thêm</Text>
    </ScrollView>
  );
}
