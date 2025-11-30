import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule

@Module({
  imports: [AuthModule], // Añadir AuthModule a los imports
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}