import api from './api';

/**
 * Service for managing push notifications
 */
class PushNotificationService {
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('This browser does not support service workers');
        return false;
      }

      // Check if push manager is supported
      if (!('PushManager' in window)) {
        console.warn('This browser does not support push notifications');
        return false;
      }

      // Get VAPID public key from backend
      const response = await api.get('/notifications/vapid-public-key');
      this.vapidPublicKey = response.data.publicKey;

      if (!this.vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    try {
      // Check if already initialized
      if (!this.vapidPublicKey) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Request permission if not granted
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast to any to avoid TS lib mismatch between BufferSource and Uint8Array<ArrayBufferLike>
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!) as any,
      });

      // Send subscription to backend
      await api.post('/notifications/subscribe', subscription.toJSON());

      this.subscription = subscription;
      localStorage.setItem('pushSubscribed', 'true');
      
      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          this.subscription = await registration.pushManager.getSubscription();
        }
      }

      if (!this.subscription) {
        console.warn('No active subscription found');
        return false;
      }

      // Unsubscribe from push manager
      await this.subscription.unsubscribe();

      // Remove subscription from backend
      await api.delete('/notifications/unsubscribe', {
        data: { endpoint: this.subscription.endpoint },
      });

      this.subscription = null;
      localStorage.removeItem('pushSubscribed');
      
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) return false;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      await api.post('/notifications/send-test');
      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  }
}

export const pushNotificationService = new PushNotificationService();
