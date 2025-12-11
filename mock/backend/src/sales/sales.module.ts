import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaypalModule } from '../paypal/paypal.module';

@Module({
  imports: [InventoryModule, NotificationsModule, PaypalModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService], // Export the service so other modules can use it
})
export class SalesModule { }
