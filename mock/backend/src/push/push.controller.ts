import { Controller, Post, Body } from '@nestjs/common';
import { PushService } from './push.service';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  async subscribe(@Body() subscription: any) {
    // Aquí podrías guardar la suscripción en una base de datos
    return this.pushService.saveSubscription(subscription);
  }

  @Post('notify')
  async notifyAll(@Body() body: { title: string; message: string; url?: string }) {
    return this.pushService.sendNotificationToAll(body.title, body.message, body.url);
  }
}
