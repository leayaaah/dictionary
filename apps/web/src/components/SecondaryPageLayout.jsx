import Header from './Header';
import AppFooter from './AppFooter';
import LoginModal from './LoginModal';
import LogoutToast from './LogoutToast';
import { useAppController } from '../hooks/useAppController';

export default function SecondaryPageLayout({ children }) {
  const {
    currentUser, isAuthInitializing, showLoginModal, showLogoutToast,
    dismissLogoutToast, openLogin, closeLogin, logout,
  } = useAppController();

  return (
    <>
      <Header onOpenLogin={openLogin} currentUser={currentUser} isAuthInitializing={isAuthInitializing} onLogout={logout} />
      <main className="secondary-page-main">{children({ currentUser, isAuthInitializing, openLogin })}</main>
      <AppFooter />
      <LoginModal show={showLoginModal} onClose={closeLogin} />
      <LogoutToast show={showLogoutToast} onClose={dismissLogoutToast} />
    </>
  );
}
