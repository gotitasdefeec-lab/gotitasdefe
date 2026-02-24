import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageOptimizationService } from '../common/image-optimization.service';

@Injectable()
export class CarouselService {
  constructor(
    private prisma: PrismaService,
    private imageOptimization: ImageOptimizationService,
  ) {}

  async findAll() {
    return this.prisma.carousel.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.carousel.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    // ✨ Optimizar imagen del carrusel automáticamente
    if (data.imageUrl) {
      data.imageUrl = await this.imageOptimization.optimizeImage(data.imageUrl);
    }
    
    return this.prisma.carousel.create({ data });
  }

  async update(id: number, data: any) {
    // ✨ Optimizar imagen del carrusel si se actualizó
    if (data.imageUrl) {
      data.imageUrl = await this.imageOptimization.optimizeImage(data.imageUrl);
    }
    
    return this.prisma.carousel.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.carousel.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('El banner no existe o ya fue eliminado');
      }
      throw error;
    }
  }
}