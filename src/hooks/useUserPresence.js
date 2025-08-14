import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';

export default function useUserPresence() {
  const { user } = useUser();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastSeen, setLastSeen] = useState({});

  // Update user's online status
  const updatePresence = useCallback(async (status = 'online') => {
    if (!user) return;

    try {
      await fetch('/api/messages/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user,
          status,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/messages/presence', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(new Set(data.onlineUsers || []));
        setLastSeen(data.lastSeen || {});
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  }, [user]);

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get user's last seen time
  const getUserLastSeen = useCallback((userId) => {
    return lastSeen[userId];
  }, [lastSeen]);

  // Format last seen time
  const formatLastSeen = useCallback((timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  }, []);

  // Set user as online when component mounts and update periodically
  useEffect(() => {
    if (!user) return;

    // Set initial online status
    updatePresence('online');

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      updatePresence('online');
    }, 30000);

    // Fetch online users every 10 seconds
    const fetchInterval = setInterval(() => {
      fetchOnlineUsers();
    }, 10000);

    // Set user as offline when page is about to unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/messages/presence', JSON.stringify({
          user,
          status: 'offline',
          timestamp: new Date().toISOString()
        }));
      }
    };

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial fetch
    fetchOnlineUsers();

    return () => {
      clearInterval(presenceInterval);
      clearInterval(fetchInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Set offline status when component unmounts
      updatePresence('offline');
    };
  }, [user, updatePresence, fetchOnlineUsers]);

  return {
    onlineUsers,
    lastSeen,
    isUserOnline,
    getUserLastSeen,
    formatLastSeen,
    updatePresence,
    fetchOnlineUsers,
  };
}