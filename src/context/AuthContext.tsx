import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../lib/db/initialData';

interface AuthContextType {
  currentUser: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchUser: (email: string) => void;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'studentstudy_auth_user';
const TOKEN_STORAGE_KEY = 'studentstudy_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      // Invalidate legacy default demo token if present
      if (storedToken === 'token_default_admin') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setCurrentUser(null);
        setToken(null);
      } else if (storedUser && storedToken) {
        try {
          const response = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const json = await response.json();
          if (!response.ok || !json.success || !json.data?.user) {
            throw new Error('Phiên đăng nhập không còn hợp lệ');
          }
          setCurrentUser(json.data.user);
          setToken(storedToken);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(json.data.user));
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setCurrentUser(null);
          setToken(null);
        }
      } else {
        setCurrentUser(null);
        setToken(null);
      }
    };

    restoreSession().catch((e) => {
      console.warn('Error reading auth state', e);
      setCurrentUser(null);
      setToken(null);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Đăng nhập không thành công');
      }

      const { user, token: authToken } = json.data;
      setCurrentUser(user);
      setToken(authToken);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const quickSwitchUser = (email: string) => {
    const user = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      const fakeToken = 'token_' + user.uid;
      setToken(fakeToken);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken);
    }
  };

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        login,
        logout,
        quickSwitchUser,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
