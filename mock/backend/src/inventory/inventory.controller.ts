import { Controller, Get, Put, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory or filter by productId' })
  findAll(@Query('productId') productId?: string) {
    if (productId) {
      return this.inventoryService.findByProductId(parseInt(productId));
    }
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findByProductId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory stock' })
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number },
  ) {
    return this.inventoryService.updateStock(id, body.quantity);
  }

  @Patch(':id/movement')
  @ApiOperation({ summary: 'Register inventory movement' })
  registerMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { type: 'entrada' | 'salida'; quantity: number; reason?: string },
  ) {
    return this.inventoryService.registerMovement(id, body.type, body.quantity, body.reason);
  }
}
