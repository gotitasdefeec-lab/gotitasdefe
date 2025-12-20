import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }
async create(data: { name: string }) {
    return this.prisma.category.create({
      data,
    });
  }

  async update(id: number, data: { name: string }) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 2349cf921eb9e3c60c1bd5ff6c6e70e6736fd273
