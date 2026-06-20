import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/authApi';
import { ROLE_LABELS } from '../utils/constants';

const AuthContext = createContext(null);

// Normalize user object: add `role` and `role_label` so Phase 8 consumers work correctly.
// Backend returns role_name (from roles.code JOIN), frontend expects user.role.
const normalizeUser = (user) => ({
  ...user,
  role: user.role_name,
  role_label: ROLE_LABELS[user.role_name] || user.role_name,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: verify token with /api/auth/me (don't trust localStorage blindly)
  useEffect(() => {
    const token = localStorage.getItem('dcms_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        const rawUser = res.data?.data?.user;
        if (rawUser) setUser(normalizeUser(rawUser));
      })
      .catch(() => {
        // Token invalid / expired — clear everything
        localStorage.removeItem('dcms_token');
        localStorage.removeItem('dcms_user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const { token, user: rawUser } = res.data.data;
    const normalized = normalizeUser(rawUser);
    localStorage.setItem('dcms_token', token);
    localStorage.setItem('dcms_user', JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clean up client side regardless
    }
    localStorage.removeItem('dcms_token');
    localStorage.removeItem('dcms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

