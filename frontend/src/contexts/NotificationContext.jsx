import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import * as notificationApi from '../api/notificationApi';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 30000; // 30 seconds (C-6: no WebSocket)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || document.visibilityState === 'hidden') return;
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data?.data?.count ?? 0);
    } catch { /* silent — polling should not disrupt UX */ }
  }, [user]);

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user) return;
    try {
      const res = await notificationApi.getList({ limit: 10, ...params });
      const d = res.data?.data || {};
      setNotifications(d.notifications || []);
      setUnreadCount(d.unread_count ?? 0);
    } catch { /* silent */ }
  }, [user]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    fetchNotifications();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, notifications, fetchNotifications, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
