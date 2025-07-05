import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { supabaseClient } from "../lib/supabase";
import NotificationSystem from "./NotificationSystem";

const NotificationButton = ({ mode, user }) => {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Get recent orders (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { data: recentOrders } = await supabaseClient
          .from('orders')
          .select('id')
          .gte('timestamp', yesterday.toISOString());

        // Get low stock products
        const { data: lowStockProducts } = await supabaseClient
          .from('products')
          .select('id')
          .lte('quantity', 10)
          .gt('quantity', 0);

        // Get out of stock products
        const { data: outOfStockProducts } = await supabaseClient
          .from('products')
          .select('id')
          .eq('quantity', 0);

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

    fetchUnreadCount();
  }, []);

  // Real-time updates for unread count
  useEffect(() => {
    const orderSubscription = supabaseClient
      .channel('orders_count')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    const productSubscription = supabaseClient
      .channel('products_count')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'products' 
      }, (payload) => {
        const updatedProduct = payload.new;
        const oldProduct = payload.old;
        
        // Check if stock changed to low or out
        if ((updatedProduct.quantity <= 10 && oldProduct.quantity > 10) ||
            (updatedProduct.quantity === 0 && oldProduct.quantity > 0)) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
      productSubscription.unsubscribe();
    };
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