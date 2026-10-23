import { useCallback, useState } from 'react';

export function useAppController() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('dictionary_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const loginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('dictionary_user', JSON.stringify(userData));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dictionary_user');
    setShowLogoutToast(true);
  };

  const dismissLogoutToast = useCallback(() => setShowLogoutToast(false), []);

  return {
    searchKeyword,
    currentUser,
    showLoginModal,
    showLogoutToast,
    dismissLogoutToast,
    openLogin: () => setShowLoginModal(true),
    closeLogin: () => setShowLoginModal(false),
    loginSuccess,
    logout,
    searchWord: setSearchKeyword,
    clearSearch: () => setSearchKeyword(''),
  };
}
