import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, type CurrentUser, type TokenResponse } from '../api/authApi';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  setTokens: (tokens: TokenResponse) => void;
  loadCurrentUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));

  const setTokens = useCallback((tokens: TokenResponse) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setIsAuthenticated(true);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, setTokens, loadCurrentUser, logout }),
    [user, isAuthenticated, setTokens, loadCurrentUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
