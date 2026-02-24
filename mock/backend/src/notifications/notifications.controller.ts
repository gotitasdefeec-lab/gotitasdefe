import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push notifications' })
  getPublicKey() {
    return {
      publicKey: this.notificationsService.getPublicKey(),
    };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  async subscribe(@Req() req: any, @Body() subscription: any) {
    const userId = req.user.userId;
    return this.notificationsService.subscribe(userId, subscription);
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribe(@Req() req: any, @Body() body: { endpoint: string }) {
    const userId = req.user.userId;
    await this.notificationsService.unsubscribe(userId, body.endpoint);
  }

  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test notification to current user' })
  async sendTest(@Req() req: any) {
    const userId = req.user.userId;
    await this.notificationsService.sendToUser(userId, {
      title: '🧪 Notificación de prueba',
      body: 'Las notificaciones push están funcionando correctamente',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        url: '/',
      },
    });
    return { message: 'Test notification sent' };
  }
}
