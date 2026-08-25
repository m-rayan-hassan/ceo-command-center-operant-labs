import { useEffect } from "react";
import { Bell, X, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  loading: boolean;
}

export default function NotificationsSidebar({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  loading
}: NotificationsSidebarProps) {
  const pathname = usePathname();

  // Close sidebar on navigation
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[var(--surface)] border-l border-[var(--border-subtle)] shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--foreground)]" />
              <h2 className="text-lg font-bold">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--foreground-variant)] hover:bg-[var(--surface-dim)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--foreground-variant)]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--foreground-variant)]">
                <Bell className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">You have no notifications.</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? "bg-[var(--background)] border-[var(--border-subtle)] opacity-70" 
                      : "bg-[var(--surface-dim)] border-[var(--color-electric-cyan)]/30"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className={`text-sm ${notification.isRead ? "text-[var(--foreground-variant)]" : "text-[var(--foreground)] font-medium"}`}>
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <button 
                        onClick={() => onMarkAsRead(notification.id)}
                        className="text-[var(--color-electric-cyan)] hover:bg-[var(--color-electric-cyan)]/10 p-1 rounded transition-colors shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--foreground-variant)] mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-[var(--border-subtle)] flex flex-col gap-2">
            <button
              onClick={onMarkAllAsRead}
              disabled={notifications.filter(n => !n.isRead).length === 0}
              className="w-full btn-outline h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
            <Link 
              href="/dashboard/notifications" 
              className="w-full flex items-center justify-center py-2 text-xs text-[var(--color-electric-cyan)] hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
