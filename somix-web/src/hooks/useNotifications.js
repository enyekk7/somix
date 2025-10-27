import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

// Default to Railway backend in production
const getAPIBase = () => {
  return import.meta.env.VITE_API_BASE || 
    (import.meta.env.PROD ? 'https://somix-production.up.railway.app/api' : 'http://localhost:3001/api');
};

// Convert HTTP to WebSocket URL
const getWebSocketURL = () => {
  const apiBase = getAPIBase();
  // Convert https:// to wss:// or http:// to ws://
  if (apiBase.includes('http://')) {
    return apiBase.replace('http://', 'ws://').replace('/api', '');
  } else if (apiBase.includes('https://')) {
    return apiBase.replace('https://', 'wss://').replace('/api', '');
  }
  return 'ws://localhost:3001';
};

const API_BASE = getAPIBase();
const WS_URL = getWebSocketURL();

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const { address } = useAccount();

  // Connect to WebSocket with better connection management
  useEffect(() => {
    if (!address) return;

    let reconnectTimeout = null;
    let isConnecting = false;
    let connectionAttempts = 0;
    const maxReconnectAttempts = 3;

    const connectWebSocket = () => {
      // Prevent multiple connections
      if (isConnecting || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
        return;
      }

      // Limit reconnection attempts
      if (connectionAttempts >= maxReconnectAttempts) {
        console.log('🔌 Max reconnection attempts reached, stopping WebSocket reconnection');
        return;
      }

      isConnecting = true;
      connectionAttempts++;

      try {
        // Close existing connection if any
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }

        const ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          isConnecting = false;
          // Authenticate with user address
          ws.send(JSON.stringify({
            type: 'auth',
            address: address
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification') {
              console.log('📱 New notification received:', data.data);
              // Add new notification to the list with deduplication
              setNotifications(prev => {
                // Check if notification already exists
                const exists = prev.some(n => n._id === data.data._id);
                if (exists) {
                  console.log('📱 Notification already exists, skipping duplicate');
                  return prev;
                }
                return [data.data, ...prev];
              });
              setUnreadCount(prev => prev + 1);
              
              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('SOMIX Notification', {
                  body: `${data.data.senderUsername} ${data.data.message}`,
                  icon: data.data.senderAvatar || '/favicon.ico'
                });
              }
            } else if (data.type === 'auth_success') {
              console.log('🔐 WebSocket authenticated');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          isConnecting = false;
          
          // Only reconnect if component is still mounted and address hasn't changed
          if (address && connectionAttempts < maxReconnectAttempts) {
            // Clear any existing timeout
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }
            // Reconnect after 10 seconds (longer delay to prevent spam)
            reconnectTimeout = setTimeout(connectWebSocket, 10000);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          isConnecting = false;
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        isConnecting = false;
      }
    };

    connectWebSocket();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

        return () => {
          // Clear timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          
          // Close WebSocket
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          
          isConnecting = false;
          connectionAttempts = 0;
        };
  }, [address]);

  // Fetch notifications from API with debouncing
  const fetchNotifications = async (params = {}) => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        address,
        page: params.page || 1,
        limit: params.limit || 20,
        type: params.type || 'all'
      });

      const response = await fetch(`${API_BASE}/notifications?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        if (params.page === 1) {
          // Deduplicate notifications by _id
          const uniqueNotifications = data.data.notifications.filter((notification, index, self) => 
            index === self.findIndex(n => n._id === notification._id)
          );
          setNotifications(uniqueNotifications);
        } else {
          // Deduplicate when adding more notifications
          setNotifications(prev => {
            const allNotifications = [...prev, ...data.data.notifications];
            return allNotifications.filter((notification, index, self) => 
              index === self.findIndex(n => n._id === notification._id)
            );
          });
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!address) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/unread-count?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!address) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!address) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        console.log('✅ All notifications marked as read, unreadCount set to 0');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Load initial data
  // Initial data fetch with debouncing
  useEffect(() => {
    if (!address) return;

    // Debounce the fetch to prevent too many requests
    const timeoutId = setTimeout(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [address]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  };
}
