import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ProductsModule } from '../products/products.module';
import { StoreModule } from '../store/store.module';
import { CategoriesModule } from '../categories/categories.module';
import { CarouselModule } from '../carousel/carousel.module';
import { SalesModule } from '../sales/sales.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PoliciesModule } from '../policies/policies.module';
import { PaypalModule } from '../paypal/paypal.module';

@Module({
  imports: [ProductsModule, StoreModule, CategoriesModule, CarouselModule, SalesModule, InventoryModule, PaypalModule],
  controllers: [PublicController],
})
export class PublicModule { }