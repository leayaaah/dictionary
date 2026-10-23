import GetWordsPage from './GetWordsPage';
import WordOfTheDay from './WordOfTheDay';

function FeaturesSection({ searchKeyword }) {
  return (
    <section id="features" className="features-section">
      {!searchKeyword && <WordOfTheDay />}
      <GetWordsPage searchKeyword={searchKeyword} />
    </section>
  );
}

export default FeaturesSection;
