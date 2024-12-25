import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

interface Notification {
  id: string;
  type: string;
  message: string;
  data: any; // Data is already parsed by the API
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

const NotificationDropdown = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationResponse = async (notification: Notification, accept: boolean) => {
    try {
      const notificationData = notification.data;
      if (!notificationData || !notificationData.connectionId) {
        throw new Error('Connection ID not found in notification data');
      }

      const connectionId = notificationData.connectionId;

      if (accept) {
        // Accept connection request
        const response = await fetch(`/api/users/connections/${connectionId}/accept`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to accept connection');
        }

        const data = await response.json();
        
        // Mark notification as read
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ read: true }),
          credentials: 'include'
        });

        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Close dropdown
        setIsOpen(false);

        // Get the other user's ID from the notification data
        const otherUser = notificationData.fromUser;
        
        toast.success('Connection accepted! Redirecting to chat...');
        router.push(`/dashboard/livechat?userId=${otherUser.id}`);
      } else {
        // Decline connection request
        const response = await fetch(`/api/users/connections/${connectionId}/reject`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to decline connection');
        }

        // Mark notification as read
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ read: true }),
          credentials: 'include'
        });

        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));

        toast.success('Connection request declined');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    }
  };

  const renderNotification = (notification: Notification) => {
    const notificationData = notification.data;

    return (
      <div
        key={notification.id}
        className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
          !notification.read ? 'bg-purple-50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex-shrink-0">
          {notification.type === 'CONNECTION_REQUEST' && (
            <div className="relative">
              {notificationData?.fromUser?.profilePicture ? (
                <img
                  src={notificationData.fromUser.profilePicture}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
              )}
              {!notification.read && (
                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-purple-400 ring-2 ring-white" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{notification.message}</p>
          <p className="mt-1 text-xs text-gray-500">
            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
          </p>
          
          {notification.type === 'CONNECTION_REQUEST' && !notification.read && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => handleNotificationResponse(notification, true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Accept
              </button>
              <button
                onClick={() => handleNotificationResponse(notification, false)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        credentials: 'same-origin'
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-3 w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <BellIcon className="h-full w-full" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => renderNotification(notification))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
