import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private salesService: SalesService) { }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new sale' })
  create(@Body() data: any) {
    return this.salesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sale (partial)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.salesService.update(id, data);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel sale and restore stock' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    return this.salesService.cancel(id, body?.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sale' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.delete(id);
  }
  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund sale via PayPal' })
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.refund(id);
  }
}
