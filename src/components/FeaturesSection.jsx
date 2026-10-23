import Words from './Words';
import WordOfTheDay from './WordOfTheDay';

function FeaturesSection({ searchKeyword }) {
  return (
    <section id="features" className="features-section">
      {!searchKeyword && <WordOfTheDay />}
      <Words searchKeyword={searchKeyword} />
    </section>
  );
}

export default FeaturesSection;
