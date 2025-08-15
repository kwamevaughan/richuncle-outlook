import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import NotificationSystem from "./NotificationSystem";
import TooltipIconButton from "./TooltipIconButton";

const NotificationButton = ({ mode, user, showLabel = false, isInDropdown = false, fullWidth = false }) => {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count function
  const fetchUnreadCount = async () => {
    try {
      // Get recent orders (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const [ordersResponse, productsResponse, conversationsResponse] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/messages/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user }),
        })
      ]);
      
      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();
      const conversationsData = await conversationsResponse.json();
      
      const recentOrders = ordersData.success ? 
        (ordersData.data || []).filter(order => new Date(order.timestamp) >= yesterday) : [];
      
      const lowStockProducts = productsData.success ? 
        (productsData.data || []).filter(p => p.quantity <= 10 && p.quantity > 0) : [];
      
      const outOfStockProducts = productsData.success ? 
        (productsData.data || []).filter(p => p.quantity <= 0) : [];

      // Get unread message count
      const unreadMessages = conversationsData.success ? 
        (conversationsData.conversations || []).reduce((total, conv) => total + (conv.unread_count || 0), 0) : 0;

      // Calculate total notifications
      const totalNotifications = 
        (recentOrders?.length || 0) + 
        (lowStockProducts?.length || 0) + 
        (outOfStockProducts?.length || 0) +
        (unreadMessages > 0 ? 1 : 0); // Add 1 for messaging if there are unread messages
      
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
      {showLabel ? (
        <button
          className={`w-full flex items-center gap-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] relative ${
            mode === "dark"
              ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
              : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
          }`}
          onClick={() => setNotifDropdownOpen((prev) => !prev)}
          aria-label="Notifications"
        >
          <Icon
            icon="mdi:bell-outline"
            className="h-5 w-5"
          />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div className="relative">
          {isInDropdown ? (
            <div 
              className={`flex items-center gap-2 w-full p-3 rounded-md ${fullWidth ? 'justify-between' : ''} hover:bg-gray-100 dark:hover:bg-gray-700`}
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:bell-outline"
                  className="h-5 w-5 text-gray-600 dark:text-gray-300"
                />
                <span className="text-sm">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          ) : (
            <TooltipIconButton
              label={
                <span className={mode === "dark" ? "text-white" : "text-black"}>
                  Notifications {unreadCount > 0 ? `(${unreadCount > 99 ? '99+' : unreadCount})` : ''}
                </span>
              }
              mode={mode}
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              className="bg-white/50 hover:-mt-1 transition-all duration-500"
            >
              <Icon
                icon="mdi:bell-outline"
                className="h-5 w-5 text-gray-600"
              />
            </TooltipIconButton>
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      )}
      
      <div className={fullWidth ? 'fixed inset-0 z-50' : 'relative'}>
        <NotificationSystem
          mode={mode}
          isOpen={notifDropdownOpen}
          onClose={() => setNotifDropdownOpen(false)}
          user={user}
          fullWidth={fullWidth}
        />
      </div>
    </div>
  );
};

export default NotificationButton; 