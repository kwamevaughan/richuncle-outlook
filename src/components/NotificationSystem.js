import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

// Notification types and their configurations
const NOTIFICATION_TYPES = {
  new_order: {
    icon: "mdi:cart-arrow-down",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    title: "New Order",
    description: "A new order has been received"
  },
  low_stock: {
    icon: "mdi:alert-outline", 
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    title: "Low Stock Alert",
    description: "Product stock is running low"
  },
  out_of_stock: {
    icon: "mdi:close-circle-outline",
    color: "text-red-500", 
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    title: "Out of Stock",
    description: "Product is out of stock"
  },
  cash_register: {
    icon: "mdi:cash-register",
    color: "text-green-500",
    bgColor: "bg-green-50", 
    borderColor: "border-green-200",
    title: "Cash Register",
    description: "Cash register activity"
  },
  new_message: {
    icon: "mdi:message-text-outline",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    title: "New Message",
    description: "You have a new message"
  },
  unread_messages: {
    icon: "mdi:message-multiple-outline",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    title: "Unread Messages",
    description: "You have unread messages"
  },
  system: {
    icon: "mdi:cog-outline",
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200", 
    title: "System",
    description: "System notification"
  }
};

const NotificationSystem = ({ mode, isOpen, onClose, user, fullWidth = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get recent orders (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const [ordersResponse, productsResponse, cashResponse, conversationsResponse] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/cash-movements'),
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
      const cashData = await cashResponse.json();
      const conversationsData = await conversationsResponse.json();
      
      const recentOrders = ordersData.success ? 
        (ordersData.data || []).filter(order => new Date(order.timestamp) >= yesterday).slice(0, 5) : [];
      
      const lowStockProducts = productsData.success ? 
        (productsData.data || []).filter(p => p.quantity <= 10 && p.quantity > 0).slice(0, 5) : [];
      
      const outOfStockProducts = productsData.success ? 
        (productsData.data || []).filter(p => p.quantity <= 0).slice(0, 3) : [];
      
      const cashActivities = cashData.success ? 
        (cashData.data || []).filter(activity => new Date(activity.created_at) >= yesterday).slice(0, 3) : [];

      // Get messaging notifications
      const conversationsWithUnread = conversationsData.success ? 
        (conversationsData.conversations || []).filter(conv => conv.unread_count > 0).slice(0, 5) : [];

      // Build notifications array
      const allNotifications = [];

      // Add new order notifications
      if (recentOrders && recentOrders.length > 0) {
        recentOrders.forEach(order => {
          allNotifications.push({
            id: `order_${order.id}`,
            type: 'new_order',
            title: `New Order #${order.id}`,
            message: `${order.customer_name || 'Walk-in Customer'} - GHS ${order.total.toLocaleString()}`,
            timestamp: order.timestamp,
            data: order,
            read: false
          });
        });
      }

      // Add low stock notifications
      if (lowStockProducts && lowStockProducts.length > 0) {
        lowStockProducts.forEach(product => {
          allNotifications.push({
            id: `low_stock_${product.id}`,
            type: 'low_stock',
            title: `Low Stock Alert`,
            message: `${product.name} - Only ${product.quantity} units left`,
            timestamp: new Date().toISOString(),
            data: product,
            read: false
          });
        });
      }

      // Add out of stock notifications
      if (outOfStockProducts && outOfStockProducts.length > 0) {
        outOfStockProducts.forEach(product => {
          allNotifications.push({
            id: `out_of_stock_${product.id}`,
            type: 'out_of_stock',
            title: `Out of Stock`,
            message: `${product.name} is completely out of stock`,
            timestamp: new Date().toISOString(),
            data: product,
            read: false
          });
        });
      }

      // Add cash register notifications
      if (cashActivities && cashActivities.length > 0) {
        cashActivities.forEach(activity => {
          const activityType = activity.type === 'sale' ? 'Sale' : 
                              activity.type === 'in' ? 'Cash In' : 
                              activity.type === 'out' ? 'Cash Out' : 'Activity';
          
          allNotifications.push({
            id: `cash_${activity.id}`,
            type: 'cash_register',
            title: `Cash Register ${activityType}`,
            message: `${activity.reason || activityType} - GHS ${activity.amount.toLocaleString()}`,
            timestamp: activity.created_at,
            data: activity,
            read: false
          });
        });
      }

      // Add messaging notifications
      if (conversationsWithUnread && conversationsWithUnread.length > 0) {
        conversationsWithUnread.forEach(conversation => {
          const lastMessage = conversation.last_message;
          const senderName = lastMessage?.sender?.full_name || 'Unknown User';
          const messagePreview = lastMessage?.content?.substring(0, 50) || 'New message';
          
          allNotifications.push({
            id: `message_${conversation.id}`,
            type: 'new_message',
            title: `New Message in ${conversation.title}`,
            message: `${senderName}: ${messagePreview}${messagePreview.length >= 50 ? '...' : ''}`,
            timestamp: lastMessage?.created_at || conversation.updated_at,
            data: conversation,
            read: false,
            unreadCount: conversation.unread_count
          });
        });
      }

      // Sort by timestamp (newest first)
      allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Handle different notification types
    switch (notification.type) {
      case 'new_order':
        // Could open order details modal
        console.log('Opening order:', notification.data);
        break;
      case 'low_stock':
      case 'out_of_stock':
        // Could open product edit modal
        console.log('Opening product:', notification.data);
        break;
      case 'cash_register':
        // Could open cash register modal
        console.log('Opening cash register activity:', notification.data);
        break;
      case 'new_message':
        // Navigate to messages page and open the specific conversation
        if (typeof window !== 'undefined') {
          window.location.href = `/messages?conversation=${notification.data.id}`;
        }
        break;
      default:
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`${fullWidth ? 'fixed inset-0 z-50' : 'absolute right-0 mt-2 w-80'} rounded-lg shadow-lg overflow-hidden transition-all duration-300 z-20
        ${mode === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-black"}
        ${fullWidth ? 'h-screen' : 'max-h-[80vh]'}
      `}
    >
      {fullWidth && (
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800"
            aria-label="Close notifications"
          >
            <Icon icon="mdi:close" className="h-6 w-6" />
          </button>
        </div>
      )}
      <div className={`p-4 border-b ${
        mode === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`text-sm ${
                mode === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
              }`}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className={`${fullWidth ? 'h-[calc(100%-120px)]' : 'max-h-96'} overflow-y-auto`}>
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center">
            <Icon icon="mdi:bell-off-outline" className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const config = NOTIFICATION_TYPES[notification.type];
              return (
                <li
                  key={notification.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    mode === "dark"
                      ? "hover:bg-gray-800 text-gray-100"
                      : "hover:bg-gray-50"
                  } ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
                      <Icon icon={config.icon} className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          mode === "dark" ? "text-gray-100" : "text-gray-900"
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        mode === "dark" ? "text-gray-300" : "text-gray-600"
                      } mt-1`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={`p-3 border-t ${fullWidth ? 'absolute bottom-0 left-0 right-0 bg-inherit' : ''} ${
        mode === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              // Could open full notifications page
              console.log('View all notifications');
            }}
            className={`text-sm ${
              mode === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
            }`}
          >
            View all notifications
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/messages';
              }
            }}
            className={`text-sm flex items-center gap-1 ${
              mode === "dark" ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-500"
            }`}
          >
            <Icon icon="mdi:message-text-outline" className="h-4 w-4" />
            Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem; 