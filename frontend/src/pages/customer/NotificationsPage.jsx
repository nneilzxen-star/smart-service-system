import React, { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../../services/api';
import { timeAgo } from '../../utils/helpers';
import { SkeletonCard, EmptyState, ErrorState } from '../../components/ui';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import useLiveTime from '../../hooks/useLiveTime';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useLiveTime();

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.notifications || []);
      setError(null);
    } catch {
      setError('Could not load notifications. Check your connection and try again.');
    }
    finally { if (showLoader) setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const pollInterval = setInterval(() => fetchNotifications(false), 10000);
    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark notification as read.');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notifications.');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeColors = {
    new_booking: 'bg-blue-100 text-blue-600',
    assignment: 'bg-purple-100 text-purple-600',
    status_update: 'bg-cyan-100 text-cyan-600',
    completion: 'bg-emerald-100 text-emerald-600',
    general: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : error && notifications.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchNotifications(true)} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here." />
      ) : (
        <>
        {error && <p role="status" className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3">{error} Showing the last available notifications.</p>}
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              className={`card p-4 cursor-pointer transition-all hover:shadow-md ${!n.is_read ? 'border-l-4 border-l-primary-500 bg-blue-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.notification_type] || typeColors.general}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
