import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  fetchCurrentUser,
  loginWithEmailPassword,
  logoutRequest,
  restoreTokenFromCallback,
} from '../api/authService';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  hasAnyRole,
  setAuthSession,
} from './authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(getStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    const activeToken = getStoredToken();
    setToken(activeToken);
    setUser(currentUser);
    setAuthSession({ token: activeToken, user: currentUser });
    return currentUser;
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (mounted) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (!mounted) {
          return;
        }
        setToken(storedToken);
        setUser(currentUser);
        setAuthSession({ token: storedToken, user: currentUser });
      } catch (error) {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    const onUnauthorized = () => {
      if (!mounted) {
        return;
      }
      clearSession();
      setIsInitializing(false);
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    restoreSession();

    return () => {
      mounted = false;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const result = await loginWithEmailPassword(credentials);
    setToken(result.token);

    if (result.user) {
      setUser(result.user);
      return result.user;
    }

    return loadCurrentUser();
  }, [loadCurrentUser]);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearSession();
  }, [clearSession]);

  const completeOAuthCallback = useCallback(async (tokenFromCallback) => {
    if (tokenFromCallback) {
      restoreTokenFromCallback(tokenFromCallback);
      setToken(tokenFromCallback);
    }

    return loadCurrentUser();
  }, [loadCurrentUser]);

  const hasRole = useCallback((role) => hasAnyRole(user, [role]), [user]);
  const hasRoles = useCallback((roles) => hasAnyRole(user, roles), [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      logout,
      loadCurrentUser,
      completeOAuthCallback,
      hasRole,
      hasRoles,
    }),
    [
      completeOAuthCallback,
      hasRole,
      hasRoles,
      isInitializing,
      loadCurrentUser,
      login,
      logout,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}

