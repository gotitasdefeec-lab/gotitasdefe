import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CarouselService } from './carousel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('carousel')
@Controller('carousel')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CarouselController {
  constructor(private carouselService: CarouselService) {}

  @Get()
  @ApiOperation({ summary: 'Get all carousel items' })
  findAll() {
    return this.carouselService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get carousel item by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carouselService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new carousel item' })
  create(@Body() data: any) {
    return this.carouselService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update carousel item' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.carouselService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete carousel item' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.carouselService.remove(id);
  }
}