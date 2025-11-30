import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { CustomersModule } from './customers/customers.module';
import { StoreModule } from './store/store.module';
import { CategoriesModule } from './categories/categories.module';
import { PoliciesModule } from './policies/policies.module';
import { CarouselModule } from './carousel/carousel.module';
import { PublicModule } from './public/public.module';
import { PushModule } from './push/push.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    CustomersModule,
    StoreModule,
    CategoriesModule,
    PoliciesModule,
    CarouselModule,
    PublicModule,
    PushModule,
    NotificationsModule,
  ],
})
export class AppModule {}
