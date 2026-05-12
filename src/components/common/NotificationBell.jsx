import React, { useState, useEffect, useRef, useContext } from 'react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {
  BellIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';
const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/notifications/unread-count'),
      ]);
      setNotifications(listRes.data.data);
      setUnreadCount(countRes.data.data.count);
    } catch (err) {
      console.error('فشل في جلب الإشعارات:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

const typeConfig = {
  info: {
    icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
    border: 'border-blue-500',
  },
  success: {
    icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    border: 'border-green-500',
  },
  warning: {
    icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
    border: 'border-yellow-500',
  },
  error: {
    icon: <XCircleIcon className="w-6 h-6 text-red-500" />,
    border: 'border-red-500',
  },
  broadcast: {
    icon: <MegaphoneIcon className="w-6 h-6 text-purple-500" />,
    border: 'border-purple-500',
  },
};

  if (!user) return null;

  return (
    <div className="relative inline-block" ref={dropdownRef} dir="rtl">
      {/* زر الجرس */}
      <button
        className="relative p-2 text-xl rounded-full hover:bg-gray-100 transition focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="الإشعارات"
      >
<BellIcon className="w-7 h-7 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '+99' : unreadCount}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
          {/* رأس القائمة */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h4 className="font-semibold text-gray-800">📢 الإشعارات</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* جسم القائمة */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-gray-500">⏳ جاري التحميل...</p>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-gray-500">📭 لا توجد إشعارات جديدة</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-r-4 cursor-pointer transition
                    ${typeConfig[notif.type]?.border || 'border-blue-500'}
                    ${!notif.is_read ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'}
                  `}
                >
                  <span className="text-lg">{typeConfig[notif.type]?.icon || 'ℹ️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {notif.content?.substring(0, 60)}...
                    </p>
                    <span className="block mt-1 text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleString('ar-EG', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* تذييل القائمة */}
          <div className="px-4 py-2 text-center border-t">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;