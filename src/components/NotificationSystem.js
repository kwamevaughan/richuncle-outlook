import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { supabaseClient } from "../lib/supabase";

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
  system: {
    icon: "mdi:cog-outline",
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200", 
    title: "System",
    description: "System notification"
  }
};

const NotificationSystem = ({ mode, isOpen, onClose, user }) => {
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
      
      const { data: recentOrders } = await supabaseClient
        .from('orders')
        .select('id, customer_name, total, timestamp')
        .gte('timestamp', yesterday.toISOString())
        .order('timestamp', { ascending: false })
        .limit(5);

      // Get low stock products
      const { data: lowStockProducts } = await supabaseClient
        .from('products')
        .select('id, name, quantity')
        .lte('quantity', 10)
        .gt('quantity', 0)
        .order('quantity', { ascending: true })
        .limit(5);

      // Get out of stock products
      const { data: outOfStockProducts } = await supabaseClient
        .from('products')
        .select('id, name, quantity')
        .eq('quantity', 0)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Get recent cash register activities
      const { data: cashActivities } = await supabaseClient
        .from('cash_movements')
        .select('id, type, amount, reason, created_at, user_id')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

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

  // Real-time updates for new orders
  useEffect(() => {
    if (!isOpen) return;

    const orderSubscription = supabaseClient
      .channel('orders_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, payload => {
        const newOrder = payload.new;
        const notification = {
          id: `order_${newOrder.id}`,
          type: 'new_order',
          title: `New Order #${newOrder.id}`,
          message: `${newOrder.customer_name || 'Walk-in Customer'} - GHS ${newOrder.total.toLocaleString()}`,
          timestamp: newOrder.timestamp,
          data: newOrder,
          read: false
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep max 10 notifications
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
    };
  }, [isOpen]);

  // Real-time updates for product stock changes
  useEffect(() => {
    if (!isOpen) return;

    const productSubscription = supabaseClient
      .channel('products_notifications')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'products' 
      }, payload => {
        const updatedProduct = payload.new;
        const oldProduct = payload.old;
        
        // Check if stock changed to low or out
        if (updatedProduct.quantity <= 10 && oldProduct.quantity > 10) {
          const notification = {
            id: `low_stock_${updatedProduct.id}`,
            type: 'low_stock',
            title: `Low Stock Alert`,
            message: `${updatedProduct.name} - Only ${updatedProduct.quantity} units left`,
            timestamp: new Date().toISOString(),
            data: updatedProduct,
            read: false
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        } else if (updatedProduct.quantity === 0 && oldProduct.quantity > 0) {
          const notification = {
            id: `out_of_stock_${updatedProduct.id}`,
            type: 'out_of_stock',
            title: `Out of Stock`,
            message: `${updatedProduct.name} is completely out of stock`,
            timestamp: new Date().toISOString(),
            data: updatedProduct,
            read: false
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      productSubscription.unsubscribe();
    };
  }, [isOpen]);

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
      className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg overflow-hidden transition-all duration-300 z-20
        ${
          mode === "dark"
            ? "bg-gray-900 text-gray-100"
            : "bg-white text-black"
        }
      `}
    >
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

      <div className="max-h-96 overflow-y-auto">
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

      {notifications.length > 0 && (
        <div className={`p-3 border-t ${
          mode === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <button
            onClick={() => {
              // Could open full notifications page
              console.log('View all notifications');
            }}
            className={`w-full text-sm ${
              mode === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
            }`}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem; 