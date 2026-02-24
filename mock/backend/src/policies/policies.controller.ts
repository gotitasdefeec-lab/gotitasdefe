import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('policies')
@Controller('policies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all policies' })
  findAll() {
    return this.policiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.policiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new policy' })
  create(@Body() data: any) {
    return this.policiesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update policy' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.policiesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete policy' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.policiesService.remove(id);
  }
}