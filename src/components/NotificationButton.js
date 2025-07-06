import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import NotificationSystem from "./NotificationSystem";

const NotificationButton = ({ mode, user }) => {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count function
  const fetchUnreadCount = async () => {
    try {
      // Get recent orders (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products')
      ]);
      
      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();
      
      const recentOrders = ordersData.success ? 
        (ordersData.data || []).filter(order => new Date(order.timestamp) >= yesterday) : [];
      
      const lowStockProducts = productsData.success ? 
        (productsData.data || []).filter(p => p.quantity <= 10 && p.quantity > 0) : [];
      
      const outOfStockProducts = productsData.success ? 
        (productsData.data || []).filter(p => p.quantity <= 0) : [];

      // Calculate total notifications
      const totalNotifications = 
        (recentOrders?.length || 0) + 
        (lowStockProducts?.length || 0) + 
        (outOfStockProducts?.length || 0);
      
      setUnreadCount(totalNotifications);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch initial unread count
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Real-time updates for unread count (simplified - you might want to implement WebSocket or polling)
  useEffect(() => {
    const interval = setInterval(() => {
      // Poll for updates every 30 seconds
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        className="flex items-center justify-center p-2 rounded-full bg-white/50 hover:-mt-1 transition-all duration-500 relative"
        onClick={() => setNotifDropdownOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Icon
          icon="mdi:bell-outline"
          className="h-5 w-5 text-gray-600"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <NotificationSystem
        mode={mode}
        isOpen={notifDropdownOpen}
        onClose={() => setNotifDropdownOpen(false)}
        user={user}
      />
    </div>
  );
};

export default NotificationButton; 