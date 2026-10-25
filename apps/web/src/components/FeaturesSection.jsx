import GetWordsPage from './GetWordsPage';
import WordOfTheDay from './WordOfTheDay';

function FeaturesSection({ searchKeyword, currentUser }) {
  return (
    <section id="features" className="features-section">
      {!searchKeyword && <WordOfTheDay />}
      <GetWordsPage searchKeyword={searchKeyword} currentUser={currentUser} />
    </section>
  );
}

export default FeaturesSection;
