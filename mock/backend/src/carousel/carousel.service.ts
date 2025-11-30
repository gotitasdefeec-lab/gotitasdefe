import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarouselService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.carousel.create({ data });
  }

  async update(id: number, data: any) {
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