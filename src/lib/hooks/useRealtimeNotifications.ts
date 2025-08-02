/**
 * React Hook for Real-time Notifications
 * Provides real-time notifications from Flask backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeDataManager } from '../api/realtime/RealtimeDataManager';
import { ApiError } from '../api/types';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
  onNewNotification?: (notification: Notification) => void;
  onError?: (error: ApiError) => void;
  maxNotifications?: number;
  autoMarkAsRead?: boolean;
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  loading: boolean;
  error: ApiError | null;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  // Default options
  const {
    enabled = true,
    onNewNotification,
    onError,
    maxNotifications = 50,
    autoMarkAsRead = false
  } = options;

  // Create a ref to the RealtimeDataManager instance
  const managerRef = useRef<RealtimeDataManager | null>(null);

  // State for notifications
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    connected: false,
    loading: false,
    error: null
  });

  // Initialize RealtimeDataManager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new RealtimeDataManager({
        websocket: {
          url: `${process.env.REACT_APP_API_WS_URL || 'ws://localhost:5000/ws'}/notifications`,
          autoReconnect: true,
          debug: process.env.NODE_ENV === 'development'
        },
        eventSource: {
          url: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/stream`,
          withCredentials: true,
          debug: process.env.NODE_ENV === 'development'
        },
        enableWebSocket: true,
        enableEventSource: true,
        enablePolling: false, // Notifications don't need polling
        debug: process.env.NODE_ENV === 'development'
      });
    }

    return () => {
      // No cleanup needed here, we keep the manager instance alive
    };
  }, []);

  // Handle connection state changes
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    const handleConnect = () => {
      setState(prev => ({
        ...prev,
        connected: true,
        error: null
      }));
    };

    const handleDisconnect = () => {
      setState(prev => ({
        ...prev,
        connected: false
      }));
    };

    const handleError = ({ error }: { error: ApiError }) => {
      setState(prev => ({
        ...prev,
        error
      }));

      if (onError) {
        onError(error);
      }
    };

    manager.on('connected', handleConnect);
    manager.on('disconnected', handleDisconnect);
    manager.on('error', handleError);

    return () => {
      manager.off('connected', handleConnect);
      manager.off('disconnected', handleDisconnect);
      manager.off('error', handleError);
    };
  }, [onError]);

  // Subscribe to notifications
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !enabled) return;

    // Handle notification updates
    const handleNotification = (notification: Notification) => {
      setState(prev => {
        // Check if notification already exists
        const existingIndex = prev.notifications.findIndex(n => n.id === notification.id);
        
        let newNotifications: Notification[];
        if (existingIndex >= 0) {
          // Update existing notification
          newNotifications = [...prev.notifications];
          newNotifications[existingIndex] = notification;
        } else {
          // Add new notification
          newNotifications = [notification, ...prev.notifications];
          
          // Limit number of notifications
          if (newNotifications.length > maxNotifications) {
            newNotifications = newNotifications.slice(0, maxNotifications);
          }

          // Call callback for new notification
          if (onNewNotification) {
            onNewNotification(notification);
          }
        }

        // Calculate unread count
        const unreadCount = newNotifications.filter(n => !n.read).length;

        return {
          ...prev,
          notifications: newNotifications,
          unreadCount,
          loading: false
        };
      });
    };

    // Subscribe to notifications channel
    setState(prev => ({ ...prev, loading: true }));
    manager.on('notification', handleNotification);
    manager.subscribe('notifications', {});

    // Update connection state
    const managerState = manager.getState();
    setState(prev => ({
      ...prev,
      connected: managerState.connected
    }));

    return () => {
      manager.off('notification', handleNotification);
      manager.unsubscribe('notifications');
    };
  }, [enabled, onNewNotification, maxNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setState(prev => {
      const newNotifications = prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      const unreadCount = newNotifications.filter(n => !n.read).length;

      return {
        ...prev,
        notifications: newNotifications,
        unreadCount
      };
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setState(prev => {
      const newNotifications = prev.notifications.filter(n => n.id !== notificationId);
      const unreadCount = newNotifications.filter(n => !n.read).length;

      return {
        ...prev,
        notifications: newNotifications,
        unreadCount
      };
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0
    }));
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return state.notifications.filter(n => n.type === type);
  }, [state.notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return state.notifications.filter(n => !n.read);
  }, [state.notifications]);

  // Auto-mark as read effect
  useEffect(() => {
    if (autoMarkAsRead && state.unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 5000); // Auto-mark as read after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [autoMarkAsRead, state.unreadCount, markAllAsRead]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getNotificationsByType,
    getUnreadNotifications
  };
}

/**
 * Hook for showing toast notifications
 */
export function useToastNotifications() {
  const [toasts, setToasts] = useState<Array<Notification & { duration?: number }>>([]);

  const showToast = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'> & { duration?: number }) => {
    const toast: Notification & { duration?: number } = {
      ...notification,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      duration: notification.duration || 5000
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    }

    return toast.id;
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  };
}