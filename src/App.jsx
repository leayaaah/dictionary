import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './components/LoginModal.css';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import FeaturesSection from './components/FeaturesSection';
import AboutSection from './components/AboutSection';
import AppFooter from './components/AppFooter';
import LoginModal from './components/LoginModal';
import { useAppController } from './hooks/useAppController';

function App() {
  const {
    searchKeyword,
    currentUser,
    showLoginModal,
    openLogin,
    closeLogin,
    loginSuccess,
    logout,
    searchWord,
    clearSearch,
  } = useAppController();

  return (
    <>
      <Header onOpenLogin={openLogin} currentUser={currentUser} onLogout={logout} />
      <main>
        <section id="home" className="hero">
          <div className="overlay" />
          <div className="hero-content">
            <SearchSection onSearch={searchWord} onClear={clearSearch} />
          </div>
        </section>
        <FeaturesSection searchKeyword={searchKeyword} />
        <AboutSection />
      </main>
      <AppFooter />
      <LoginModal show={showLoginModal} onClose={closeLogin} onLoginSuccess={loginSuccess} />
    </>
  );
}

export default App;
