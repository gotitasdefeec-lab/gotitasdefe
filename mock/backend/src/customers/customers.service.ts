import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    try {
      return await this.prisma.customer.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('email')) {
            throw new ConflictException('Este email ya está registrado. Por favor usa un email diferente.');
          }
          if (target.includes('cedula')) {
            throw new ConflictException('Esta cédula ya está registrada. Por favor verifica el número.');
          }
          throw new ConflictException('Ya existe un cliente con estos datos únicos.');
        }
      }
      throw error;
    }
  }

  async update(id: number, data: any) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('email')) {
            throw new ConflictException('Este email ya está registrado. Por favor usa un email diferente.');
          }
          if (target.includes('cedula')) {
            throw new ConflictException('Esta cédula ya está registrada. Por favor verifica el número.');
          }
          throw new ConflictException('Ya existe un cliente con estos datos únicos.');
        }
      }
      throw error;
    }
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
