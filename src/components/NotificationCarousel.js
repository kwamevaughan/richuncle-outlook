import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router';
import { differenceInHours, format, startOfToday, endOfToday, isWithinInterval, parseISO } from 'date-fns';

export default function NotificationCarousel({ mode = 'light' }) {
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  // Fetch notifications (low stock, long-running sessions, etc.)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const todayStart = startOfToday();
        const todayEnd = endOfToday();
        
        // Fetch all data in parallel
        const [productsRes, sessionsRes, ordersRes] = await Promise.all([
          fetch('/api/products?low_stock=true'),
          fetch('/api/cash-register-sessions?status=open'),
          fetch('/api/orders')
        ]);

        const [productsData, sessionsData, ordersData] = await Promise.all([
          productsRes.json(),
          sessionsRes.json(),
          ordersRes.json()
        ]);

        const notificationList = [];

        // Add today's orders count
        if (ordersData.success && ordersData.data) {
          const todayOrders = ordersData.data.filter(order => {
            if (!order.timestamp) return false;
            try {
              const orderDate = parseISO(order.timestamp.replace(' ', 'T'));
              return isWithinInterval(orderDate, { start: todayStart, end: todayEnd });
            } catch (error) {
              return false;
            }
          });
          
          const orderCount = todayOrders.length;
          if (orderCount > 0) {
            notificationList.push({
              id: 'today-orders',
              type: 'info',
              icon: 'mdi:shopping',
              iconClass: 'text-blue-600',
              message: `You have ${orderCount} Order${orderCount > 1 ? 's' : ''} Today`,
              action: () => {
                // Store the date filter in session storage before navigation
                sessionStorage.setItem('orderHistoryDateFilter', 'today');
                router.push('/pos?showRecentTransactions=true', undefined, { shallow: true });
              }
            });
          }
        }

        // Add low stock notifications
        if (productsData.success && productsData.data) {
          const lowStockCount = productsData.data.filter(p => p.quantity <= 10 && p.quantity > 0).length;
          const outOfStockCount = productsData.data.filter(p => p.quantity <= 0).length;
          
          if (lowStockCount > 0) {
            notificationList.push({
              id: "low-stock",
              type: "warning",
              icon: "hugeicons:package-out-of-stock",
              iconClass: "text-yellow-600",
              message: `${lowStockCount} item${
                lowStockCount > 1 ? "s" : ""
              } running low on stock`,
              action: () => router.push("/manage-stock"),
            });
          }
          
          if (outOfStockCount > 0) {
            notificationList.push({
              id: 'out-of-stock',
              type: 'error',
              icon: 'mdi:package-variant-remove',
              iconClass: 'text-red-600',
              message: `${outOfStockCount} item${outOfStockCount > 1 ? 's' : ''} out of stock`,
              action: () => router.push('/manage-stock')
            });
          }
        }

        // Add long-running session notifications (admin only)
        if (sessionsData.success && sessionsData.data) {
          const longRunningSessions = sessionsData.data.filter(session => {
            if (!session?.opened_at) return false;
            const openedAt = new Date(session.opened_at);
            return (Date.now() - openedAt) > (24 * 60 * 60 * 1000); // 24 hours
          });

          if (longRunningSessions.length > 0) {
            notificationList.push({
              id: 'long-running-sessions',
              type: 'warning',
              icon: 'mdi:clock-alert-outline',
              iconClass: 'text-orange-600',
              message: `${longRunningSessions.length} register${longRunningSessions.length > 1 ? 's' : ''} open >24h`,
              action: () => router.push('/registers')
            });
          }
        }

        setNotifications(notificationList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate notifications with smooth transitions
  useEffect(() => {
    if (notifications.length <= 1) return;
    
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % notifications.length);
        setIsAnimating(false);
      }, 300); // Match this with the CSS transition duration
    }, 5000); // Rotate every 5 seconds
    
    return () => clearInterval(timer);
  }, [notifications.length]);
  
  // Handle manual navigation
  const goToNotification = (index) => {
    if (index === currentIndex || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 50);
  };

  if (notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];
  const typeColors = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800'
  };

  return (
    <div className="relative">
      <div 
        className={`flex items-center px-6 py-2 rounded-full text-md font-medium cursor-pointer transition-all duration-300 ease-in-out ${
          typeColors[currentNotification.type] || typeColors.info
        } hover:opacity-90 transform ${
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        onClick={currentNotification.action}
      >
        <Icon 
          icon={currentNotification.icon} 
          className={`w-6 h-6 mr-3 transition-transform duration-300 ${
            currentNotification.iconClass || ''
          }`} 
        />
        <span className="transition-all duration-300">{currentNotification.message}</span>
        
        {notifications.length > 1 && (
          <div className="ml-10 flex items-center space-x-2">
            {notifications.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-current w-4' 
                    : 'bg-current opacity-30 hover:opacity-60'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToNotification(index);
                }}
                aria-label={`Go to notification ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
