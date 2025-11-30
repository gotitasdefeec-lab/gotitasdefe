import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { registrationDate: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { sales: true },
    });
  }

  async create(data: any) {
    return this.prisma.customer.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }



  async findOrders(customerId: number) {
    return this.prisma.sale.findMany({
      where: { customerId },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { date: 'desc' },
    });
  }
}
