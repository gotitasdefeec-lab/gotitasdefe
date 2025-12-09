import { Injectable } from '@nestjs/common';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  private subscriptions: any[] = [];

  constructor() {
    // Configurar claves VAPID desde variables de entorno (opcional)
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(
          'mailto:admin@localhost',
          publicKey,
          privateKey
        );
        console.log('Push notifications configured successfully');
      } catch (error) {
        console.warn('Failed to configure push notifications:', error.message);
      }
    } else {
      console.warn('VAPID keys not configured. Push notifications will not work.');
    }
  }

  saveSubscription(subscription: any) {
    // Aquí deberías guardar la suscripción en una base de datos real
    this.subscriptions.push(subscription);
    return { success: true };
  }

  getAllSubscriptions() {
    return this.subscriptions;
  }

  async sendNotificationToAll(title: string, body: string, url?: string) {
    const payload = JSON.stringify({
      title,
      body,
      data: url ? { url } : undefined
    });
    const results = [];
    for (const sub of this.subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ success: true });
      } catch (err) {
        results.push({ success: false, error: err });
      }
    }
    return results;
  }
}
