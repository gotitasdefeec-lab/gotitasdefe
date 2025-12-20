import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll() {
    return this.categoriesService.findAll();
  }
@Post()
  @ApiOperation({ summary: 'Create a category' })
  create(@Body() data: { name: string }) {
    return this.categoriesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: { name: string }
  ) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
