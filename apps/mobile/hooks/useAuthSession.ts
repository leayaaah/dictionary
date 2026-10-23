import { useCallback, useEffect, useState } from 'react';
import type { Account, AuthChangeEvent, Session } from '@dictionary/shared';
import { getSession, onAuthStateChange, signOut } from '../services/authService';

export function useAuthSession() {
  const [user, setUser] = useState<Account | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  useEffect(() => {
    let active = true;
    let authEventVersion = 0;
    const handleAuthChange = (_event: AuthChangeEvent, session: Session | null) => {
      authEventVersion += 1;
      setUser(session?.user ?? null);
      setIsInitializing(false);
    };

    const subscription = onAuthStateChange(handleAuthChange);
    const initialEventVersion = authEventVersion;

    getSession()
      .then((session) => {
        if (!active) return;
        if (authEventVersion === initialEventVersion) setUser(session?.user ?? null);
        setIsInitializing(false);
      })
      .catch((error: unknown) => {
        console.error('Không thể khôi phục phiên đăng nhập:', error);
        if (!active) return;
        if (authEventVersion === initialEventVersion) setUser(null);
        setIsInitializing(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setShowLogoutToast(true);
      return true;
    } catch (error) {
      console.error('Không thể đăng xuất khỏi Supabase:', error);
      return false;
    }
  }, []);

  const dismissLogoutToast = useCallback(() => setShowLogoutToast(false), []);

  return { user, isInitializing, logout, showLogoutToast, dismissLogoutToast };
}
