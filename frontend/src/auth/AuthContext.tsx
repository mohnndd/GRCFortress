import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, logout as logoutRequest, type CurrentUser, type TokenResponse } from '../api/authApi';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  setTokens: (tokens: TokenResponse) => void;
  loadCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
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

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);

    // Best-effort: revoke the refresh token server-side so it can't be replayed.
    // Client-side state is already cleared above regardless of whether this succeeds.
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Ignore - the user is logged out locally either way.
      }
    }
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
