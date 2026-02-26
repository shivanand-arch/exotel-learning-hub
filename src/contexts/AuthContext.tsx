import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import type { User } from '../types';
import { ALLOWED_DOMAIN, GOOGLE_CLIENT_ID, isAdminEmail } from '../config/constants';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Full Google OAuth provider (used when VITE_GOOGLE_CLIENT_ID is set) ──────
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('exotel-hub-user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const handleGoogleSuccess = useCallback(async (tokenResponse: { access_token: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const info = await res.json();
      const email: string = info.email || '';
      const domain = email.split('@')[1] || '';

      if (domain !== ALLOWED_DOMAIN) {
        setError(`Access restricted to @${ALLOWED_DOMAIN} accounts. You signed in with @${domain}.`);
        setIsLoading(false);
        return;
      }

      const userData: User = { id: info.sub, email, name: info.name, picture: info.picture, domain };
      localStorage.setItem('exotel-hub-user', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      setError('Sign-in failed. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google sign-in failed. Please try again.'),
    hosted_domain: ALLOWED_DOMAIN,
  });

  const login = useCallback(() => { setError(null); googleLogin(); }, [googleLogin]);
  const logout = useCallback(() => { localStorage.removeItem('exotel-hub-user'); setUser(null); }, []);

  const isAdmin = user ? isAdminEmail(user.email) : false;

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Dev / no-OAuth fallback (used when VITE_GOOGLE_CLIENT_ID is not set) ─────
function AuthProviderDev({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('exotel-hub-user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const login = useCallback(() => {
    const devUser: User = { id: 'dev', email: 'dev@exotel.com', name: 'Dev User', picture: '', domain: 'exotel.com' };
    localStorage.setItem('exotel-hub-user', JSON.stringify(devUser));
    setUser(devUser);
  }, []);

  const logout = useCallback(() => { localStorage.removeItem('exotel-hub-user'); setUser(null); }, []);

  // In dev mode (no Google OAuth), always grant admin access for testing
  return (
    <AuthContext.Provider value={{ user, isAdmin: true, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    return <AuthProviderDev>{children}</AuthProviderDev>;
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}
