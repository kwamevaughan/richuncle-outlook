import toast from 'react-hot-toast';

class PushNotificationService {
  constructor() {
    this.permission = null;
    this.registration = null;
    this.isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initialize() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Request permission
      this.permission = await Notification.requestPermission();
      
      if (this.permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('Push notification service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  async subscribeToTopic(topic) {
    if (!this.registration || this.permission !== 'granted') {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          topic
        }),
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  async unsubscribeFromTopic(topic) {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } else {
      // Fallback to toast
      toast.success(`${title}: ${options.body || ''}`);
    }
  }

  showMessageNotification(senderName, message, conversationTitle) {
    this.showNotification(
      `New message from ${senderName}`,
      {
        body: message,
        tag: `message-${conversationTitle}`,
        data: {
          type: 'message',
          conversationTitle,
          senderName
        }
      }
    );
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Only create instance on client side
let pushNotificationService = null;

if (typeof window !== 'undefined') {
  pushNotificationService = new PushNotificationService();
}

export default pushNotificationService; 