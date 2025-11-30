import { Injectable } from '@nestjs/common';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  private subscriptions: any[] = [];

  constructor() {
    // Configurar claves VAPID desde variables de entorno
    webpush.setVapidDetails(
      'mailto:admin@localhost',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
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
