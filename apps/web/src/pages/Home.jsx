import Header from '../components/Header';
import SearchSection from '../components/SearchSection';
import FeaturesSection from '../components/FeaturesSection';
import AboutSection from '../components/AboutSection';
import AppFooter from '../components/AppFooter';
import LoginModal from '../components/LoginModal';
import LogoutToast from '../components/LogoutToast';
import { useAppController } from '../hooks/useAppController';

function Home() {
  const {
    searchKeyword,
    currentUser,
    isAuthInitializing,
    showLoginModal,
    showLogoutToast,
    dismissLogoutToast,
    openLogin,
    closeLogin,
    logout,
    searchWord,
    clearSearch,
  } = useAppController();

  return (
    <>
      <Header onOpenLogin={openLogin} currentUser={currentUser} isAuthInitializing={isAuthInitializing} onLogout={logout} />
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
      <LoginModal show={showLoginModal} onClose={closeLogin} />
      <LogoutToast show={showLogoutToast} onClose={dismissLogoutToast} />
    </>
  );
}

export default Home;
