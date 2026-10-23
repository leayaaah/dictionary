import { useCallback, useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signOut } from '../services/authService';

export function useAppController() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authEventVersion = 0;

    const subscription = onAuthStateChange((event, session) => {
      authEventVersion += 1;
      setCurrentUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('dictionary_user');
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setIsAuthInitializing(false);
      }
    });

    const initialEventVersion = authEventVersion;
    getSession()
      .then((session) => {
        if (!isMounted) return;
        if (authEventVersion === initialEventVersion) {
          setCurrentUser(session?.user ?? null);
        }
        localStorage.removeItem('dictionary_user');
        setIsAuthInitializing(false);
      })
      .catch((error) => {
        console.error('Không thể khôi phục phiên đăng nhập:', error);
        if (!isMounted) return;
        if (authEventVersion === initialEventVersion) {
          setCurrentUser(null);
        }
        localStorage.removeItem('dictionary_user');
        setIsAuthInitializing(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
      setCurrentUser(null);
      localStorage.removeItem('dictionary_user');
      setShowLogoutToast(true);
    } catch (error) {
      console.error('Không thể đăng xuất khỏi Supabase:', error);
    }
  }, []);

  const dismissLogoutToast = useCallback(() => setShowLogoutToast(false), []);

  return {
    searchKeyword,
    currentUser,
    isAuthInitializing,
    showLoginModal,
    showLogoutToast,
    dismissLogoutToast,
    openLogin: () => setShowLoginModal(true),
    closeLogin: () => setShowLoginModal(false),
    logout,
    searchWord: setSearchKeyword,
    clearSearch: () => setSearchKeyword(''),
  };
}
