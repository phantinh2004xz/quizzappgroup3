import React, { useState, useEffect } from 'react';
import { realtimeDb, auth } from '../shared/firebase-config';
import { ref, onValue } from 'firebase/database';
import { notificationService, type Notification as NotificationType } from '../services/notificationService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Lấy notifications của user hiện tại
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userNotifications = await notificationService.getUserNotifications();
          setNotifications(userNotifications);
          setUnreadCount(userNotifications.filter(n => !n.isRead).length);
        }
      } catch (error) {
        console.error('Lỗi khi tải notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  // Lắng nghe notifications realtime
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const notificationsRef = ref(realtimeDb, `notifications/${user.uid}`);
    const handle = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.values(data).map((notification: any) => ({
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          relatedId: notification.relatedId,
          isRead: notification.isRead,
          createdAt: new Date(notification.createdAt),
          readAt: notification.readAt ? new Date(notification.readAt) : undefined,
        }));
        // Sắp xếp mới nhất lên đầu
        notificationsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Nếu có notification mới, hiện popup
        if (notificationsList.length > notifications.length) {
          const newNoti = notificationsList.find(n => !notifications.some(o => o.id === n.id));
          if (newNoti) {
            toast.info(`${newNoti.title}: ${newNoti.message}`, { autoClose: 4000 });
          }
        }
        setNotifications(notificationsList);
        setUnreadCount(notificationsList.filter(n => !n.isRead).length);
        // Scroll lên notification mới nhất
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = 0;
        }, 100);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });
    return () => handle();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      // Sau khi đánh dấu đã đọc, cập nhật lại notifications
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi đánh dấu notification đã đọc:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Sau khi xóa, cập nhật lại notifications
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi xóa notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả notifications đã đọc:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_created':
        return '📝';
      case 'course_added':
        return '📚';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'exam_created':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'course_added':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              Thông báo của tôi
              {unreadCount > 0 && (
                <span className="ml-2 inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-600 mt-1">Quản lý thông báo hệ thống</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors font-medium"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto" ref={listRef}>
          {loading ? (
            <div className="p-6 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-lg font-medium mb-2">Không có thông báo nào</h3>
              <p className="text-sm">Bạn sẽ nhận được thông báo khi có bài thi mới hoặc được thêm vào lớp học</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        !notification.isRead ? 'bg-sky-100' : 'bg-slate-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full font-medium">
                            Mới
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-600 mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>
                            {format(notification.createdAt, 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            getNotificationColor(notification.type)
                          }`}>
                            {notification.type === 'exam_created' ? 'Bài thi mới' : 
                             notification.type === 'course_added' ? 'Được thêm vào lớp' : 
                             notification.type}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium"
                            >
                              Đã đọc
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>
                Tổng cộng: {notifications.length} thông báo
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 text-sky-600 font-medium">
                    ({notifications.filter(n => !n.isRead).length} chưa đọc)
                  </span>
                )}
              </span>
              <span>
                Cập nhật lần cuối: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Hiển thị popup notification */}
      <ToastContainer position="top-right" />
    </div>
  );
};

export default UserNotification; 