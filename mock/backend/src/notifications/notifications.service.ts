import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {
    // Configure VAPID details
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured. Push notifications will not work.');
    } else {
      webpush.setVapidDetails(
        'mailto:admin@example.com',
        vapidPublicKey,
        vapidPrivateKey,
      );
      this.logger.log('Web Push configured successfully');
    }
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: number, subscription: PushSubscription): Promise<any> {
    try {
      // Store subscription in database
      const sub = await this.prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint,
          },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

      this.logger.log(`User ${userId} subscribed to push notifications`);
      return sub;
    } catch (error) {
      this.logger.error(`Error subscribing user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(userId: number, endpoint: string): Promise<void> {
    try {
      await this.prisma.pushSubscription.delete({
        where: {
          userId_endpoint: {
            userId,
            endpoint,
          },
        },
      });
      this.logger.log(`User ${userId} unsubscribed from push notifications`);
    } catch (error) {
      this.logger.error(`Error unsubscribing user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: number, payload: any): Promise<void> {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId },
      });

      const promises = subscriptions.map((sub) =>
        this.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        ),
      );

      await Promise.allSettled(promises);
      this.logger.log(`Sent notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  /**
   * Send push notification to all subscribed users
   */
  async sendToAll(payload: any): Promise<void> {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany();

      const promises = subscriptions.map((sub) =>
        this.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        ),
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Sent notification to all users: ${successful} successful, ${failed} failed`,
      );
    } catch (error) {
      this.logger.error('Error sending notification to all users:', error);
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendNotification(
    subscription: PushSubscription,
    payload: any,
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        subscription as any,
        JSON.stringify(payload),
      );
    } catch (error: any) {
      // If subscription is no longer valid, remove it from database
      if (error.statusCode === 410) {
        this.logger.warn(`Subscription expired: ${subscription.endpoint}`);
        // endpoint alone is not unique; remove any matching records
        await this.prisma.pushSubscription
          .deleteMany({
            where: {
              endpoint: subscription.endpoint,
            },
          })
          .catch(() => {});
      } else {
        this.logger.error('Error sending push notification:', error);
      }
      throw error;
    }
  }

  /**
   * Get VAPID public key
   */
  getPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY || '';
  }
}
