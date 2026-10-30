import { useCallback } from 'react';
import Header from '../components/Header';
import SearchSection from '../components/SearchSection';
import FeaturesSection from '../components/FeaturesSection';
import AboutSection from '../components/AboutSection';
import AppFooter from '../components/AppFooter';
import LoginModal from '../components/LoginModal';
import LogoutToast from '../components/LogoutToast';
import { useAppController } from '../hooks/useAppController';
import { addSearchHistory } from '../services/profileService';

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
  } = useAppController();

  const handleSearch = useCallback((keyword) => {
    searchWord(keyword);
    if (currentUser && keyword) {
      addSearchHistory(keyword).catch((error) => console.error('Không thể lưu lịch sử tra cứu:', error));
    }
  }, [currentUser, searchWord]);

  return (
    <>
      <Header onOpenLogin={openLogin} currentUser={currentUser} isAuthInitializing={isAuthInitializing} onLogout={logout} />
      <main>
        <section id="home" className="hero">
          <div className="overlay" />
          <div className="hero-content">
            <SearchSection onSearch={handleSearch} />
          </div>
        </section>
        <FeaturesSection searchKeyword={searchKeyword} currentUser={currentUser} />
        {/* <AboutSection /> */}
      </main>
      <AppFooter />
      <LoginModal show={showLoginModal} onClose={closeLogin} />
      <LogoutToast show={showLogoutToast} onClose={dismissLogoutToast} />
    </>
  );
}

export default Home;
