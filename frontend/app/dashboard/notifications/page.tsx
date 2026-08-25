"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Bell, Check, Loader2, CheckCircle2 } from "lucide-react";
import { Notification } from "../../../components/NotificationsSidebar";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark as read", err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.patch("/notifications/read-all");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: false } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="section-number">System</div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-[var(--foreground-variant)] mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-outline h-9 px-4 text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass-card p-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--foreground-variant)]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--foreground-variant)]">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium opacity-80">All caught up</p>
            <p className="text-sm opacity-60">You don't have any notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`flex gap-4 p-5 transition-colors hover:bg-[var(--surface-dim)] ${
                  !notification.isRead ? "bg-[var(--surface-dim)]/50" : ""
                }`}
              >
                <div className="mt-1">
                  {notification.isRead ? (
                    <Bell className="w-5 h-5 text-[var(--foreground-variant)] opacity-50" />
                  ) : (
                    <div className="relative">
                      <Bell className="w-5 h-5 text-[var(--color-electric-cyan)]" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-electric-cyan)] rounded-full"></span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.isRead ? "text-[var(--foreground-variant)]" : "text-[var(--foreground)] font-medium"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-[var(--foreground-variant)] mt-1 opacity-70">
                    {new Date(notification.createdAt).toLocaleString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {!notification.isRead && (
                  <div className="shrink-0 flex items-center justify-center ml-4">
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-[var(--foreground-variant)] hover:text-[var(--color-electric-cyan)] hover:bg-[var(--color-electric-cyan)]/10 rounded-md transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
