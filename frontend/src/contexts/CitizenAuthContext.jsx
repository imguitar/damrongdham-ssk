import { createContext, useContext, useState, useEffect } from 'react';
import * as citizenApi from '../api/citizenApi';

const CitizenAuthContext = createContext(null);

export const CitizenAuthProvider = ({ children }) => {
  const [citizen, setCitizen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dcms_citizen_token');
    if (!token) { setIsLoading(false); return; }
    citizenApi.me()
      .then((res) => {
        const c = res.data?.data?.citizen;
        if (c) setCitizen(c);
      })
      .catch(() => {
        localStorage.removeItem('dcms_citizen_token');
        localStorage.removeItem('dcms_citizen_user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await citizenApi.login(email, password);
    const { token, citizen: c } = res.data.data;
    localStorage.setItem('dcms_citizen_token', token);
    localStorage.setItem('dcms_citizen_user', JSON.stringify(c));
    setCitizen(c);
    return c;
  };

  const logout = async () => {
    try { await citizenApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('dcms_citizen_token');
    localStorage.removeItem('dcms_citizen_user');
    setCitizen(null);
  };

  return (
    <CitizenAuthContext.Provider value={{ citizen, isLoading, login, logout, setCitizen }}>
      {children}
    </CitizenAuthContext.Provider>
  );
};

export const useCitizenAuth = () => {
  const ctx = useContext(CitizenAuthContext);
  if (!ctx) throw new Error('useCitizenAuth must be used within CitizenAuthProvider');
  return ctx;
};
