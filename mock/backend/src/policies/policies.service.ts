import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.policy.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.policy.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.policy.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.policy.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.policy.delete({
      where: { id },
    });
  }
}