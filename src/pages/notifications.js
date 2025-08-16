
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import MainLayout from '@/layouts/MainLayout';
import { useUser } from '../hooks/useUser';
import useLogout from '../hooks/useLogout';
import { supabase } from '../lib/supabase';
import DateRangePicker from '@/components/DateRangePicker';
import SimpleModal from '@/components/SimpleModal';
import { playMessageNotification } from '../utils/messageSounds';

// Notification types and their configurations
const NOTIFICATION_TYPES = {
  new_order: {
    icon: 'mdi:cart-arrow-down',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'New Order',
  },
  low_stock: {
    icon: 'mdi:package-variant-alert',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Low Stock',
  },
  out_of_stock: {
    icon: 'mdi:package-variant-remove',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Out of Stock',
  },
  long_running_register: {
    icon: 'mdi:clock-alert-outline',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Long-Running Register',
  },
};

const NotificationsPage = ({ mode = "light", toggleMode, ...props }) => {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();
  
  // Core state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // Search and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: startOfMonth, endDate: today, label: "This Month" };
  });

  // Bulk actions state
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    soundEnabled: true,
    soundVolume: 0.5,
    soundType: 'gentle',
    desktopNotifications: true,
    emailNotifications: false,
    types: {
      new_order: true,
      low_stock: true,
      out_of_stock: true,
      long_running_register: true,
    }
  });

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=${PAGE_SIZE}`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (append) {
        setNotifications(prev => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load and pagination
  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);
  
  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          // Play notification sound if enabled
          if (notificationPreferences.soundEnabled && typeof window !== 'undefined') {
            try {
              if (notificationPreferences.soundType === 'gentle') {
                playMessageNotification(1200, 0.3, notificationPreferences.soundVolume);
              } else {
                // Play different sound types
                const frequency = notificationPreferences.soundType === 'alert' ? 800 : 1200;
                playMessageNotification(frequency, 0.4, notificationPreferences.soundVolume);
              }
            } catch (error) {
              console.log('Could not play notification sound:', error);
            }
          }

          // Show desktop notification if enabled
          if (notificationPreferences.desktopNotifications && typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
            new Notification('New Notification', {
              body: payload.new.message,
              icon: '/icon-192x192.png',
              vibrate: [200, 100, 200]
            });
          }
          
          // Update UI
          setNotifications(prev => [payload.new, ...prev]);
          
          // Show toast
          toast.custom((t) => (
            <div className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
              t.visible ? 'animate-enter' : 'animate-leave'
            }`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <Icon 
                      icon={NOTIFICATION_TYPES[payload.new.type]?.icon || 'mdi:bell'}
                      className={`h-6 w-6 ${NOTIFICATION_TYPES[payload.new.type]?.color || 'text-gray-400'}`}
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {payload.new.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {payload.new.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push(payload.new.link || '#');
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  View
                </button>
              </div>
            </div>
          ));
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, notificationPreferences]);

  // Filtered notifications based on search, date range, and type filter
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(notification => notification.type === filter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.data?.order_id?.toString().includes(searchLower) ||
        notification.data?.product_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.created_at);
        return notificationDate >= dateRange.startDate && notificationDate <= dateRange.endDate;
      });
    }

    return filtered;
  }, [notifications, filter, searchTerm, dateRange]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state to mark all as read
      setNotifications(prev => prev.map(n => ({
        ...n,
        read: true
      })));
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ notificationIds: selectedNotifications }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev => prev.map(n => 
        selectedNotifications.includes(n.id) ? { ...n, read: true } : n
      ));
      
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success(`${selectedNotifications.length} notifications marked as read`);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ notificationIds: selectedNotifications }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }

      // Update local state
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success(`${selectedNotifications.length} notifications deleted`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
      setSelectAll(false);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
      setSelectAll(true);
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        const newSelected = prev.filter(id => id !== notificationId);
        setSelectAll(newSelected.length === filteredNotifications.length);
        return newSelected;
      } else {
        const newSelected = [...prev, notificationId];
        setSelectAll(newSelected.length === filteredNotifications.length);
        return newSelected;
      }
    });
  };
  
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const createTestNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test notifications');
      }
      
      toast.success('Test notifications created successfully');
      fetchNotifications(1, false); // Refresh the list
    } catch (error) {
      console.error('Error creating test notifications:', error);
      toast.error('Failed to create test notifications');
    }
  };

  const saveNotificationPreferences = async () => {
    try {
      // Save to localStorage for now (could be extended to save to database)
      localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
      toast.success('Notification preferences saved');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  // Load preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
      try {
        setNotificationPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

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
    
    // Handle different notification types
    switch (notification.type) {
      case 'new_order':
        router.push(`/sales?order=${notification.data?.id}`);
        break;
      case 'low_stock':
      case 'out_of_stock':
        router.push(`/products?product=${notification.data?.id}`);
        break;
      case 'long_running_register':
        router.push('/registers');
        break;
      case 'new_message':
        router.push(`/messages?conversation=${notification.data?.id}`);
        break;
      default:
        if (notification.link) {
          router.push(notification.link);
        }
        break;
    }
  };

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-col justify-center py-4 pt-0 md:pt-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with your business activities
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Settings button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'dark'
                  ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon icon="mdi:cog" className="h-4 w-4 mr-2 inline" />
              Settings
            </button>

            {/* Mark all as read button */}
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'dark'
                    ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mark all read
              </button>
            )}

            {/* Test button - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={createTestNotifications}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Create Test Data
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Icon
                icon="mdi:magnify"
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  mode === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`}
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all search-input ${
                  mode === 'dark'
                    ? 'border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 filter-dropdown transition-all ${
                mode === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              <option value="new_order">New Orders</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="long_running_register">Long-Running Register</option>
            </select>

            {/* Date Range Picker */}
            <div className="w-full lg:w-auto">
              <DateRangePicker 
                value={dateRange} 
                onChange={setDateRange}
                className="w-full lg:w-64"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4 bulk-actions-bar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedNotifications.length} notification(s) selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markSelectedAsRead}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark as Read
                </button>
                <button
                  onClick={deleteSelectedNotifications}
                  className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Icon 
                icon="mdi:bell-off-outline" 
                className="h-12 w-12 text-gray-400 mx-auto mb-4" 
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' && !searchTerm && !dateRange.label.includes('Custom')
                  ? "You're all caught up! No new notifications." 
                  : `No ${filter.replace('_', ' ')} notifications found matching your criteria.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => {
                const config = NOTIFICATION_TYPES[notification.type] || {
                  icon: 'mdi:bell',
                  color: 'text-gray-500',
                  bgColor: 'bg-gray-50',
                  borderColor: 'border-gray-200',
                  title: 'Notification'
                };
                
                const isSelected = selectedNotifications.includes(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors relative notification-item ${
                      mode === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-50'
                    } ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox for bulk selection */}
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 notification-checkbox"
                        />
                      </div>

                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
                        <Icon icon={config.icon} className={`h-5 w-5 ${config.color}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              mode === 'dark' ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                              {notification.title || config.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              mode === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {/* Unread indicator */}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                            
                            {/* Time */}
                            <span className={`text-xs ${
                              mode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Additional data if available */}
                        {notification.data && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {notification.data.order_id && `Order #${notification.data.order_id}`}
                            {notification.data.product_name && `Product: ${notification.data.product_name}`}
                            {notification.data.quantity && `Quantity: ${notification.data.quantity}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Clickable overlay for notification actions */}
                    <div 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Load more button */}
          {hasMore && filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={loadMore}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : mode === 'dark'
                    ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loading ? 'Loading...' : 'Load more notifications'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings Modal */}
      <SimpleModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Notification Preferences"
        mode={mode}
        width="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Sound Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Sound & Audio</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.soundEnabled}
                    onChange={(e) => setNotificationPreferences(prev => ({
                      ...prev,
                      soundEnabled: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Enable notification sounds</span>
                </label>
                <Icon 
                  icon={notificationPreferences.soundEnabled ? "mdi:volume-high" : "mdi:volume-off"} 
                  className="h-5 w-5 text-gray-500" 
                />
              </div>

              {notificationPreferences.soundEnabled && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Sound Type</label>
                    <select
                      value={notificationPreferences.soundType}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        soundType: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="gentle">Gentle Chime</option>
                      <option value="alert">Alert Tone</option>
                      <option value="notification">Notification Sound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Volume: {Math.round(notificationPreferences.soundVolume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={notificationPreferences.soundVolume}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        soundVolume: parseFloat(e.target.value)
                      }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Notifications */}
          <div>
            <h3 className="text-lg font-medium mb-4">Desktop Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.desktopNotifications}
                    onChange={(e) => setNotificationPreferences(prev => ({
                      ...prev,
                      desktopNotifications: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Show desktop notifications</span>
                </label>
                <Icon 
                  icon={notificationPreferences.desktopNotifications ? "mdi:desktop-classic" : "mdi:desktop-tower-monitor"} 
                  className="h-5 w-5 text-gray-500" 
                />
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium mb-4">Notification Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(notificationPreferences.types).map(([type, enabled]) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setNotificationPreferences(prev => ({
                      ...prev,
                      types: {
                        ...prev.types,
                        [type]: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveNotificationPreferences}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
};

export default NotificationsPage;
