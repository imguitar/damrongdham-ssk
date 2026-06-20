import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Phase 9 will replace this with a real /api/auth/me call
    try {
      const stored = localStorage.getItem('dcms_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('dcms_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('dcms_user');
    localStorage.removeItem('dcms_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
