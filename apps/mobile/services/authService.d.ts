import type { Account, AuthChangeEvent, AuthResponse, Session } from '@dictionary/shared';

export function signIn(email: string, password: string): Promise<Account>;
export function signUp(details: { fullName: string; email: string; password: string }): Promise<AuthResponse['data']>;
export function getSession(): Promise<Session | null>;
export function signOut(): Promise<void>;
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): { unsubscribe(): void };
