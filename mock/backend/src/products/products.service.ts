import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { images, ...rest } = createProductDto;
    const product = await this.prisma.product.create({
      data: {
        ...rest,
        images: Array.isArray(images) ? images : [],
        minStock: createProductDto.minStock ?? 10,
        status: createProductDto.status ?? 'active',
      },
    });

    // Create corresponding inventory entry
    await this.prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: createProductDto.stock,
        minStock: createProductDto.minStock ?? 10,
        maxStock: 100,
        location: 'Almacén',
      },
    });

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Validate exists

    const { images, ...rest } = updateProductDto;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(images !== undefined ? { images } : {}),
      },
    });

    // Update inventory if stock changed
    if (updateProductDto.stock !== undefined) {
      await this.prisma.inventory.updateMany({
        where: { productId: id },
        data: { quantity: updateProductDto.stock },
      });
    }

    return product;
  }

  async remove(id: number) {
    await this.findOne(id); // Validate exists
    
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
